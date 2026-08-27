import { useMemo, useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useRoads } from '@/stores';
import { getRoadColor } from '@/types';
import type { Road } from '@/types';
import { getStandardMaterial } from '@/utils/materialPool';

// 성능 설정
const RENDER_DISTANCE = 100; // 도로 렌더링 거리
const CHUNK_SIZE = 8; // 한 번에 로드할 도로 수 (줄임)
const LOAD_INTERVAL = 80; // 청크 로드 간격 (ms) (늘림)

/**
 * 모든 도로를 렌더링하는 컨테이너 컴포넌트
 * 점진적 로딩 + 거리 기반 컬링
 */
export function Roads() {
  const allRoads = useRoads();
  const { camera } = useThree();
  const [loadedCount, setLoadedCount] = useState(0);
  const [visibleRoads, setVisibleRoads] = useState<Road[]>([]);
  const frameCount = useRef(0);

  // 점진적 로딩
  useEffect(() => {
    if (allRoads.length === 0) {
      setLoadedCount(0);
      setVisibleRoads([]);
      return;
    }

    let currentCount = 0;
    setLoadedCount(0);

    // 재귀 setTimeout 은 반드시 정리한다. 안 하면 언마운트·의존성 변경 뒤에도
    // 체인이 계속 돌면서 사라진 컴포넌트에 setState 를 부른다.
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const loadNextChunk = () => {
      if (cancelled) return;
      currentCount = Math.min(currentCount + CHUNK_SIZE, allRoads.length);
      setLoadedCount(currentCount);

      if (currentCount < allRoads.length) {
        timerId = setTimeout(loadNextChunk, LOAD_INTERVAL);
      }
    };

    loadNextChunk();

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
      setLoadedCount(0);
    };
  }, [allRoads]);

  // 매 프레임 가시 도로 업데이트 (60프레임마다 - 성능 최적화)
  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 60 !== 0) return;

    const cameraPos = camera.position;
    const loadedRoads = allRoads.slice(0, loadedCount);

    const visible = loadedRoads.filter(road => {
      if (road.points.length === 0) return false;
      const center = getRoadCenter(road);
      const distance = Math.sqrt(
        Math.pow(center.x - cameraPos.x, 2) + Math.pow(center.z - cameraPos.z, 2)
      );
      return distance < RENDER_DISTANCE;
    });

    // 변경이 있을 때만 업데이트 (불필요한 리렌더 방지)
    if (visible.length !== visibleRoads.length ||
        visible.some((road, i) => road.id !== visibleRoads[i]?.id)) {
      setVisibleRoads(visible);
    }
  });

  if (allRoads.length === 0) {
    return <SampleRoads />;
  }

  return (
    <group name="roads">
      {visibleRoads.map(road => (
        <RoadMesh key={road.id} road={road} />
      ))}
    </group>
  );
}

/**
 * 샘플 도로 (검색 전 표시)
 */
function SampleRoads() {
  const sampleRoads: Road[] = [
    // 메인 도로 (동서)
    {
      id: 'sample-main-ew',
      type: 'primary',
      name: '메인 도로',
      points: [
        { x: -80, z: 0 },
        { x: -40, z: 0 },
        { x: 0, z: 0 },
        { x: 40, z: 0 },
        { x: 80, z: 0 },
      ],
      width: 8,
    },
    // 메인 도로 (남북)
    {
      id: 'sample-main-ns',
      type: 'primary',
      name: '중앙로',
      points: [
        { x: 0, z: -80 },
        { x: 0, z: -40 },
        { x: 0, z: 0 },
        { x: 0, z: 40 },
        { x: 0, z: 80 },
      ],
      width: 8,
    },
    // 보조 도로 1
    {
      id: 'sample-sec-1',
      type: 'secondary',
      points: [
        { x: -60, z: -30 },
        { x: -30, z: -30 },
        { x: 0, z: -30 },
        { x: 30, z: -30 },
        { x: 60, z: -30 },
      ],
      width: 6,
    },
    // 보조 도로 2
    {
      id: 'sample-sec-2',
      type: 'secondary',
      points: [
        { x: -60, z: 30 },
        { x: -30, z: 30 },
        { x: 0, z: 30 },
        { x: 30, z: 30 },
        { x: 60, z: 30 },
      ],
      width: 6,
    },
    // 주거지 도로 (세로)
    {
      id: 'sample-res-1',
      type: 'residential',
      points: [
        { x: -30, z: -50 },
        { x: -30, z: -30 },
        { x: -30, z: 0 },
        { x: -30, z: 30 },
        { x: -30, z: 50 },
      ],
      width: 4,
    },
    {
      id: 'sample-res-2',
      type: 'residential',
      points: [
        { x: 30, z: -50 },
        { x: 30, z: -30 },
        { x: 30, z: 0 },
        { x: 30, z: 30 },
        { x: 30, z: 50 },
      ],
      width: 4,
    },
    // 보행자 도로
    {
      id: 'sample-ped-1',
      type: 'pedestrian',
      points: [
        { x: -15, z: -15 },
        { x: -15, z: 0 },
        { x: -15, z: 15 },
      ],
      width: 2,
    },
    {
      id: 'sample-ped-2',
      type: 'pedestrian',
      points: [
        { x: 15, z: -15 },
        { x: 15, z: 0 },
        { x: 15, z: 15 },
      ],
      width: 2,
    },
  ];

  return (
    <group name="sample-roads">
      {sampleRoads.map(road => (
        <RoadMesh key={road.id} road={road} />
      ))}
    </group>
  );
}

function getRoadCenter(road: Road): { x: number; z: number } {
  if (road.points.length === 0) return { x: 0, z: 0 };
  const midIndex = Math.floor(road.points.length / 2);
  const midPoint = road.points[midIndex];
  return midPoint ? { x: midPoint.x, z: midPoint.z } : { x: 0, z: 0 };
}

interface RoadMeshProps {
  road: Road;
}

// 인도/연석 설정
const SIDEWALK_WIDTH = 2; // 인도 폭
const CURB_HEIGHT = 0.15; // 연석 높이
const CURB_WIDTH = 0.2; // 연석 폭

/**
 * 개별 도로 메쉬
 */
function RoadMesh({ road }: RoadMeshProps) {
  const roadGeometry = useMemo(() => {
    if (road.points.length < 2) return null;

    const halfWidth = road.width / 2;
    const leftPoints: THREE.Vector2[] = [];
    const rightPoints: THREE.Vector2[] = [];

    for (let i = 0; i < road.points.length; i++) {
      const curr = road.points[i]!;
      const prev = road.points[i - 1];
      const next = road.points[i + 1];

      let dx = 0, dz = 0;

      if (next && prev) {
        dx = (next.x - prev.x) / 2;
        dz = (next.z - prev.z) / 2;
      } else if (next) {
        dx = next.x - curr.x;
        dz = next.z - curr.z;
      } else if (prev) {
        dx = curr.x - prev.x;
        dz = curr.z - prev.z;
      }

      const len = Math.sqrt(dx * dx + dz * dz);
      if (len === 0) continue;

      const nx = -dz / len * halfWidth;
      const nz = dx / len * halfWidth;

      leftPoints.push(new THREE.Vector2(curr.x + nx, curr.z + nz));
      rightPoints.push(new THREE.Vector2(curr.x - nx, curr.z - nz));
    }

    if (leftPoints.length < 2) return null;

    const shape = new THREE.Shape();
    shape.moveTo(leftPoints[0]!.x, leftPoints[0]!.y);

    for (let i = 1; i < leftPoints.length; i++) {
      shape.lineTo(leftPoints[i]!.x, leftPoints[i]!.y);
    }

    for (let i = rightPoints.length - 1; i >= 0; i--) {
      shape.lineTo(rightPoints[i]!.x, rightPoints[i]!.y);
    }

    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0.02, 0);

    return geo;
  }, [road.points, road.width]);

  const color = getRoadColor(road.type);
  const isPedestrian = road.type === 'pedestrian' || road.type === 'footway';
  const hasSidewalk = road.type === 'primary' || road.type === 'secondary' || road.type === 'residential';

  // 머티리얼 풀링 - 도로 타입별 머티리얼 캐싱
  const roadMaterial = useMemo(() => {
    return getStandardMaterial({
      color,
      roughness: isPedestrian ? 0.7 : 0.95,
      metalness: 0,
    });
  }, [color, isPedestrian]);

  if (!roadGeometry) return null;

  return (
    <group>
      {/* 도로 본체 */}
      <mesh geometry={roadGeometry} receiveShadow material={roadMaterial} />

      {/* 중앙선 */}
      {(road.type === 'primary' || road.type === 'secondary') && (
        <CenterLine road={road} />
      )}

      {/* 인도 + 연석 */}
      {hasSidewalk && (
        <>
          <Sidewalk road={road} side="left" />
          <Sidewalk road={road} side="right" />
          <Curb road={road} side="left" />
          <Curb road={road} side="right" />
        </>
      )}
    </group>
  );
}

/**
 * 인도 (보도)
 */
function Sidewalk({ road, side }: { road: Road; side: 'left' | 'right' }) {
  const geometry = useMemo(() => {
    if (road.points.length < 2) return null;

    const halfWidth = road.width / 2;
    const offset = side === 'left' ? halfWidth + CURB_WIDTH : -(halfWidth + CURB_WIDTH);
    const sidewalkOffset = side === 'left' ? SIDEWALK_WIDTH : -SIDEWALK_WIDTH;

    const innerPoints: THREE.Vector2[] = [];
    const outerPoints: THREE.Vector2[] = [];

    for (let i = 0; i < road.points.length; i++) {
      const curr = road.points[i]!;
      const prev = road.points[i - 1];
      const next = road.points[i + 1];

      let dx = 0, dz = 0;

      if (next && prev) {
        dx = (next.x - prev.x) / 2;
        dz = (next.z - prev.z) / 2;
      } else if (next) {
        dx = next.x - curr.x;
        dz = next.z - curr.z;
      } else if (prev) {
        dx = curr.x - prev.x;
        dz = curr.z - prev.z;
      }

      const len = Math.sqrt(dx * dx + dz * dz);
      if (len === 0) continue;

      const nx = -dz / len;
      const nz = dx / len;

      innerPoints.push(new THREE.Vector2(
        curr.x + nx * offset,
        curr.z + nz * offset
      ));
      outerPoints.push(new THREE.Vector2(
        curr.x + nx * (offset + sidewalkOffset),
        curr.z + nz * (offset + sidewalkOffset)
      ));
    }

    if (innerPoints.length < 2) return null;

    const shape = new THREE.Shape();
    shape.moveTo(innerPoints[0]!.x, innerPoints[0]!.y);

    for (let i = 1; i < innerPoints.length; i++) {
      shape.lineTo(innerPoints[i]!.x, innerPoints[i]!.y);
    }

    for (let i = outerPoints.length - 1; i >= 0; i--) {
      shape.lineTo(outerPoints[i]!.x, outerPoints[i]!.y);
    }

    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, CURB_HEIGHT + 0.01, 0);

    return geo;
  }, [road.points, road.width, side]);

  const sidewalkMaterial = useMemo(() => {
    return getStandardMaterial({
      color: '#A0A0A0', // 밝은 회색 (보도블록)
      roughness: 0.8,
      metalness: 0,
    });
  }, []);

  if (!geometry) return null;

  return <mesh geometry={geometry} receiveShadow material={sidewalkMaterial} />;
}

/**
 * 연석 (도로와 인도 경계)
 */
function Curb({ road, side }: { road: Road; side: 'left' | 'right' }) {
  const geometry = useMemo(() => {
    if (road.points.length < 2) return null;

    const halfWidth = road.width / 2;
    const offset = side === 'left' ? halfWidth : -halfWidth;
    const curbOffset = side === 'left' ? CURB_WIDTH : -CURB_WIDTH;

    const innerPoints: THREE.Vector3[] = [];
    const outerPoints: THREE.Vector3[] = [];

    for (let i = 0; i < road.points.length; i++) {
      const curr = road.points[i]!;
      const prev = road.points[i - 1];
      const next = road.points[i + 1];

      let dx = 0, dz = 0;

      if (next && prev) {
        dx = (next.x - prev.x) / 2;
        dz = (next.z - prev.z) / 2;
      } else if (next) {
        dx = next.x - curr.x;
        dz = next.z - curr.z;
      } else if (prev) {
        dx = curr.x - prev.x;
        dz = curr.z - prev.z;
      }

      const len = Math.sqrt(dx * dx + dz * dz);
      if (len === 0) continue;

      const nx = -dz / len;
      const nz = dx / len;

      innerPoints.push(new THREE.Vector3(
        curr.x + nx * offset,
        0,
        curr.z + nz * offset
      ));
      outerPoints.push(new THREE.Vector3(
        curr.x + nx * (offset + curbOffset),
        0,
        curr.z + nz * (offset + curbOffset)
      ));
    }

    if (innerPoints.length < 2) return null;

    // 연석을 ExtrudeGeometry로 생성
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(CURB_WIDTH, 0);
    shape.lineTo(CURB_WIDTH, CURB_HEIGHT);
    shape.lineTo(0, CURB_HEIGHT);
    shape.closePath();

    // 경로를 따라 extrude
    const path = new THREE.CatmullRomCurve3(innerPoints, false, 'centripetal');

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: Math.max(innerPoints.length * 2, 10),
      extrudePath: path,
    });

    return geo;
  }, [road.points, road.width, side]);

  const curbMaterial = useMemo(() => {
    return getStandardMaterial({
      color: '#808080', // 진한 회색 (콘크리트)
      roughness: 0.9,
      metalness: 0,
    });
  }, []);

  if (!geometry) return null;

  return <mesh geometry={geometry} receiveShadow material={curbMaterial} />;
}

function CenterLine({ road }: { road: Road }) {
  const points = useMemo(() => {
    return road.points.map(p => [p.x, 0.04, p.z] as [number, number, number]);
  }, [road.points]);

  return (
    <Line
      points={points}
      color="#FFFFFF"
      lineWidth={1}
      dashed
      dashSize={1}
      gapSize={0.5}
      worldUnits={false}
      raycast={() => null}
    />
  );
}
