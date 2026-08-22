import { useMemo } from 'react';
import * as THREE from 'three';
import type { Building as BuildingType, BuildingType as BuildingTypeEnum } from '@/types';
import { getStandardMaterial, getBasicMaterial } from '@/utils/materialPool';

interface BuildingProps {
  building: BuildingType;
}

// 창문 색상 팔레트
const WINDOW_COLORS = ['#FFE5B4', '#FFF8DC', '#FFEFD5', '#FFD700'];

// 빌딩 타입별 스타일 설정
const BUILDING_STYLES: Record<BuildingTypeEnum, {
  wallColor: string;
  roofColor: string;
  roofType: 'flat' | 'pointed' | 'sloped' | 'dome';
  accentColor?: string;
  features?: ('flag' | 'cross' | 'sign' | 'chimney')[];
}> = {
  // 교육 시설 - 따뜻한 색상
  school: {
    wallColor: '#FFF5E6',
    roofColor: '#E67E22',
    roofType: 'sloped',
    accentColor: '#F39C12',
    features: ['flag'],
  },
  university: {
    wallColor: '#FDEBD0',
    roofColor: '#8E44AD',
    roofType: 'dome',
    accentColor: '#9B59B6',
    features: ['flag'],
  },
  kindergarten: {
    wallColor: '#FCF3CF',
    roofColor: '#FF6B6B',
    roofType: 'pointed',
    accentColor: '#4ECDC4',
  },

  // 주거 시설
  residential: {
    wallColor: '#FAE5D3',
    roofColor: '#CD5C5C',
    roofType: 'sloped',
  },
  apartments: {
    wallColor: '#E8E8E8',
    roofColor: '#4A5568',
    roofType: 'flat',
  },
  dormitory: {
    wallColor: '#D5E8D4',
    roofColor: '#556B2F',
    roofType: 'flat',
  },
  house: {
    wallColor: '#FDEBD0',
    roofColor: '#8B4513',
    roofType: 'pointed',
    features: ['chimney'],
  },

  // 상업 시설
  commercial: {
    wallColor: '#D4E6F1',
    roofColor: '#2E86AB',
    roofType: 'flat',
    accentColor: '#3498DB',
    features: ['sign'],
  },
  retail: {
    wallColor: '#FFE5B4',
    roofColor: '#F39C12',
    roofType: 'flat',
    accentColor: '#E74C3C',
  },
  office: {
    wallColor: '#BDC3C7',
    roofColor: '#34495E',
    roofType: 'flat',
  },

  // 산업 시설
  industrial: {
    wallColor: '#ABB2B9',
    roofColor: '#566573',
    roofType: 'sloped',
    features: ['chimney'],
  },
  warehouse: {
    wallColor: '#D5D8DC',
    roofColor: '#7F8C8D',
    roofType: 'sloped',
  },

  // 공공 시설
  hospital: {
    wallColor: '#FFFFFF',
    roofColor: '#E74C3C',
    roofType: 'flat',
    accentColor: '#E74C3C',
    features: ['cross'],
  },
  church: {
    wallColor: '#F7F9F9',
    roofColor: '#5D6D7E',
    roofType: 'pointed',
    features: ['cross'],
  },
  civic: {
    wallColor: '#EBF5FB',
    roofColor: '#2980B9',
    roofType: 'dome',
    features: ['flag'],
  },

  // 기본
  default: {
    wallColor: '#E8E8E8',
    roofColor: '#7F8C8D',
    roofType: 'flat',
  },
};

/**
 * 빌딩 타입에 따른 벽 색상 반환
 */
export function getBuildingColor(type: BuildingTypeEnum): string {
  return BUILDING_STYLES[type]?.wallColor || BUILDING_STYLES.default.wallColor;
}

/**
 * 상세 건물 컴포넌트 (가까운 거리용)
 * 빌딩 타입에 따라 다른 스타일 적용
 */
export function Building({ building }: BuildingProps) {
  // 건물 중심점 및 바운딩 박스 계산
  const { center, bounds } = useMemo(() => {
    if (building.footprint.length === 0) return { center: { x: 0, z: 0 }, bounds: { width: 0, depth: 0 } };

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of building.footprint) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
    }

    return {
      center: { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 },
      bounds: { width: maxX - minX, depth: maxZ - minZ },
    };
  }, [building.footprint]);

  // 빌딩 타입에 따른 스타일 가져오기
  const style = useMemo(() => {
    return BUILDING_STYLES[building.type] || BUILDING_STYLES.default;
  }, [building.type]);

  // 머티리얼 풀링 - 빌딩 타입별 머티리얼 캐싱
  const materials = useMemo(() => ({
    wall: getStandardMaterial({
      color: building.color || style.wallColor,
      roughness: 0.85,
      metalness: 0.05,
    }),
    roof: getStandardMaterial({
      color: style.roofColor,
      roughness: 0.6,
    }),
    flagPole: getStandardMaterial({
      color: '#4A5568',
      metalness: 0.7,
    }),
    flag: getStandardMaterial({
      color: style.accentColor || '#E74C3C',
      side: THREE.DoubleSide,
    }),
    cross: getStandardMaterial({
      color: style.accentColor || '#E74C3C',
    }),
    chimney: getStandardMaterial({
      color: '#8B4513',
      roughness: 0.9,
    }),
    sign: style.accentColor ? getStandardMaterial({
      color: style.accentColor,
      emissive: style.accentColor,
      emissiveIntensity: 0.2,
    }) : null,
  }), [building.color, style]);

  // 건물 본체 지오메트리
  const geometry = useMemo(() => {
    if (building.footprint.length < 3) return null;

    const shape = new THREE.Shape();
    const first = building.footprint[0];
    if (!first) return null;

    shape.moveTo(first.x, first.z);
    for (let i = 1; i < building.footprint.length; i++) {
      const point = building.footprint[i];
      if (point) shape.lineTo(point.x, point.z);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: building.height,
      bevelEnabled: false, // 베벨 제거로 성능 향상
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [building.footprint, building.height]);

  // 간단한 지붕 지오메트리
  const roofGeometry = useMemo(() => {
    const w = Math.max(bounds.width, 2);
    const d = Math.max(bounds.depth, 2);

    switch (style.roofType) {
      case 'pointed':
        return new THREE.ConeGeometry(Math.max(w, d) * 0.6, 2, 4);
      case 'sloped':
        // 삼각형 지붕
        return new THREE.ConeGeometry(Math.max(w, d) * 0.5, 1.5, 4);
      case 'dome':
        return new THREE.SphereGeometry(Math.max(w, d) * 0.35, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      default:
        return new THREE.BoxGeometry(w + 0.3, 0.3, d + 0.3);
    }
  }, [bounds, style.roofType]);

  // 창문 (최소화)
  const windows = useMemo(() => {
    const seed = hashCode(building.id);
    const floors = Math.min(3, Math.floor(building.height / 3)); // 최대 3층만
    const result: Array<{ pos: [number, number, number]; color: string }> = [];

    for (let floor = 0; floor < floors; floor++) {
      const y = floor * 3 + 2;
      // 앞면만 창문 (성능)
      if (seededRandom(seed + floor) > 0.3) {
        result.push({
          pos: [center.x, y, center.z + bounds.depth / 2 + 0.05],
          color: WINDOW_COLORS[seed % WINDOW_COLORS.length]!,
        });
      }
    }
    return result;
  }, [building.id, building.height, bounds, center]);

  // 창문 머티리얼 풀링 (hooks는 early return 전에 호출)
  const windowMaterials = useMemo(() => {
    return windows.map(win => getBasicMaterial({ color: win.color }));
  }, [windows]);

  if (!geometry) return null;

  const hasFlag = style.features?.includes('flag');
  const hasCross = style.features?.includes('cross');
  const hasChimney = style.features?.includes('chimney');
  const hasSign = style.features?.includes('sign');

  return (
    <group>
      {/* 건물 본체 */}
      <mesh geometry={geometry} receiveShadow material={materials.wall} />

      {/* 지붕 */}
      <mesh
        geometry={roofGeometry}
        position={[center.x, building.height + 0.15, center.z]}
        receiveShadow
        material={materials.roof}
      />

      {/* 창문 (간소화) */}
      {windows.map((win, i) => (
        <mesh key={i} position={win.pos} material={windowMaterials[i]}>
          <planeGeometry args={[0.8, 1]} />
        </mesh>
      ))}

      {/* 특징 요소들 */}
      {hasFlag && (
        <group position={[center.x, building.height + 2, center.z]}>
          {/* 깃대 */}
          <mesh position={[0, 0.5, 0]} material={materials.flagPole}>
            <cylinderGeometry args={[0.03, 0.03, 2, 6]} />
          </mesh>
          {/* 깃발 */}
          <mesh position={[0.3, 1.2, 0]} material={materials.flag}>
            <planeGeometry args={[0.6, 0.4]} />
          </mesh>
        </group>
      )}

      {hasCross && (
        <group position={[center.x, building.height + 1.5, center.z]}>
          {/* 십자가 세로 */}
          <mesh position={[0, 0.4, 0]} material={materials.cross}>
            <boxGeometry args={[0.15, 1.2, 0.15]} />
          </mesh>
          {/* 십자가 가로 */}
          <mesh position={[0, 0.7, 0]} material={materials.cross}>
            <boxGeometry args={[0.6, 0.15, 0.15]} />
          </mesh>
        </group>
      )}

      {hasChimney && (
        <mesh position={[center.x + bounds.width * 0.3, building.height + 0.8, center.z]} material={materials.chimney}>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
        </mesh>
      )}

      {hasSign && materials.sign && (
        <mesh position={[center.x, building.height * 0.7, center.z + bounds.depth / 2 + 0.1]} material={materials.sign}>
          <boxGeometry args={[bounds.width * 0.6, 1, 0.1]} />
        </mesh>
      )}
    </group>
  );
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
