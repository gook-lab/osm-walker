import { useRef, useEffect, useState, useCallback } from 'react';
import { useBuildings, usePOIs, useRoads } from '@/stores';
import { POI_COLORS } from '@/constants';
import { getRoadColor } from '@/types';

const MAP_SIZE = 150; // 미니맵 크기 (px)
const MAP_SCALE = 0.5; // 1m = 0.5px
const VISIBLE_RANGE = 200; // 미니맵에 표시할 범위 (m)
const UPDATE_THROTTLE = 200; // 업데이트 간격 (ms)

interface MinimapProps {
  playerPosition?: { x: number; z: number };
}

/**
 * 미니맵 컴포넌트
 * 현재 위치, 건물, POI를 2D로 표시
 */
export function Minimap({ playerPosition = { x: 0, z: 0 } }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buildings = useBuildings();
  const pois = usePOIs();
  const roads = useRoads();
  const [isExpanded, setIsExpanded] = useState(false);
  const lastUpdateRef = useRef(0);
  const rafRef = useRef<number>(0);

  const size = isExpanded ? MAP_SIZE * 2 : MAP_SIZE;
  const scale = isExpanded ? MAP_SCALE * 2 : MAP_SCALE;

  const drawMinimap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 초기화
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;

    // 가시 범위 내 도로만 필터링
    const visibleRoads = roads.filter(road => {
      if (road.points.length === 0) return false;
      const mid = road.points[Math.floor(road.points.length / 2)];
      if (!mid) return false;
      const dx = mid.x - playerPosition.x;
      const dz = mid.z - playerPosition.z;
      return Math.abs(dx) < VISIBLE_RANGE && Math.abs(dz) < VISIBLE_RANGE;
    }).slice(0, 50); // 최대 50개

    // 도로 그리기 (건물 아래에 먼저)
    for (const road of visibleRoads) {
      if (road.points.length < 2) continue;

      ctx.beginPath();
      ctx.strokeStyle = getRoadColor(road.type);
      ctx.lineWidth = Math.max(road.width * scale * 0.5, 1);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const first = road.points[0];
      if (!first) continue;

      const startX = centerX + (first.x - playerPosition.x) * scale;
      const startY = centerY + (first.z - playerPosition.z) * scale;
      ctx.moveTo(startX, startY);

      for (let i = 1; i < road.points.length; i++) {
        const point = road.points[i];
        if (!point) continue;
        const x = centerX + (point.x - playerPosition.x) * scale;
        const y = centerY + (point.z - playerPosition.z) * scale;
        ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    // 가시 범위 내 건물만 필터링
    const visibleBuildings = buildings.filter(building => {
      if (building.footprint.length === 0) return false;
      const first = building.footprint[0];
      if (!first) return false;
      const dx = first.x - playerPosition.x;
      const dz = first.z - playerPosition.z;
      return Math.abs(dx) < VISIBLE_RANGE && Math.abs(dz) < VISIBLE_RANGE;
    }).slice(0, 100); // 최대 100개

    // 건물 그리기
    ctx.fillStyle = '#3a3a5a';
    ctx.strokeStyle = '#5a5a7a';
    ctx.lineWidth = 0.5;

    for (const building of visibleBuildings) {
      if (building.footprint.length < 3) continue;

      ctx.beginPath();
      const first = building.footprint[0];
      if (!first) continue;

      const startX = centerX + (first.x - playerPosition.x) * scale;
      const startY = centerY + (first.z - playerPosition.z) * scale;
      ctx.moveTo(startX, startY);

      for (let i = 1; i < building.footprint.length; i++) {
        const point = building.footprint[i];
        if (!point) continue;
        const x = centerX + (point.x - playerPosition.x) * scale;
        const y = centerY + (point.z - playerPosition.z) * scale;
        ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 가시 범위 내 POI만 필터링
    const visiblePOIs = pois.filter(poi => {
      const dx = poi.position.x - playerPosition.x;
      const dz = poi.position.z - playerPosition.z;
      return Math.abs(dx) < VISIBLE_RANGE && Math.abs(dz) < VISIBLE_RANGE;
    }).slice(0, 30); // 최대 30개

    // POI 마커 그리기
    for (const poi of visiblePOIs) {
      const x = centerX + (poi.position.x - playerPosition.x) * scale;
      const y = centerY + (poi.position.z - playerPosition.z) * scale;

      // 범위 체크
      if (x < 0 || x > size || y < 0 || y > size) continue;

      const color = POI_COLORS[poi.category] || POI_COLORS.default;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // 플레이어 위치 (중앙)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff88';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 방향 표시 (화살표)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 8);
    ctx.lineTo(centerX - 4, centerY);
    ctx.lineTo(centerX + 4, centerY);
    ctx.closePath();
    ctx.fillStyle = '#00ff88';
    ctx.fill();

    // 테두리
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);

    // 스케일 표시
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.fillText(`${Math.round(size / scale / 2)}m`, 4, size - 4);

  }, [buildings, pois, roads, playerPosition, size, scale]);

  // 쓰로틀된 업데이트
  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current < UPDATE_THROTTLE) {
      // 쓰로틀 중이면 다음 프레임에 업데이트 예약
      rafRef.current = requestAnimationFrame(() => {
        drawMinimap();
        lastUpdateRef.current = Date.now();
      });
      return;
    }

    drawMinimap();
    lastUpdateRef.current = now;

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [drawMinimap]);

  return (
    <div className="pointer-events-auto absolute right-4 bottom-16 sm:bottom-20">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-lg shadow-lg cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ imageRendering: 'pixelated' }}
        />

        {/* 확대/축소 힌트 */}
        <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
          {isExpanded ? '−' : '+'}
        </div>

        {/* 북쪽 표시 */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-1 rounded">
          N
        </div>
      </div>
    </div>
  );
}
