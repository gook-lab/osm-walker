import { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { POI } from '@/types';
import { POI_COLORS } from '@/constants';

interface POIMarkerProps {
  poi: POI;
  onClick?: (poi: POI) => void;
}

/**
 * 개별 POI 마커 컴포넌트
 */
export function POIMarker({ poi, onClick }: POIMarkerProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const color = POI_COLORS[poi.category] || POI_COLORS.default;
  const emoji = getCategoryEmoji(poi.category);

  const handlePointerOver = () => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  const handleClick = () => {
    onClick?.(poi);
  };

  return (
    <group
      ref={meshRef}
      position={[poi.position.x, 2, poi.position.z]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* 기둥 */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
        <meshStandardMaterial color="#ffffff" opacity={0.6} transparent />
      </mesh>

      {/* 마커 본체 (방울 모양) */}
      <mesh scale={hovered ? 1.3 : 1}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </mesh>

      {/* 마커 내부 아이콘 배경 */}
      <mesh position={[0, 0, 0.3]} scale={hovered ? 1.3 : 1}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 이모지 아이콘 (HTML) */}
      <Html
        position={[0, 0, 0.35]}
        center
        style={{
          pointerEvents: 'none',
          fontSize: hovered ? '20px' : '16px',
          transition: 'font-size 0.2s',
        }}
      >
        {emoji}
      </Html>

      {/* 호버 시 이름 표시 */}
      {hovered && poi.name && (
        <Html
          position={[0, 1.2, 0]}
          center
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {poi.name}
        </Html>
      )}

      {/* 발광 효과 (emissive glow - pointLight 제거로 성능 최적화) */}
      <mesh position={[0, 0, 0]} scale={hovered ? 1.5 : 1.2}>
        <sphereGeometry args={[0.55, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.4 : 0.2} />
      </mesh>
    </group>
  );
}

/**
 * 카테고리별 이모지
 */
function getCategoryEmoji(category: POI['category']): string {
  switch (category) {
    case 'restaurant':
      return '🍽️';
    case 'cafe':
      return '☕';
    case 'bar':
      return '🍺';
    case 'subway':
      return '🚇';
    case 'bus_stop':
      return '🚌';
    case 'park':
      return '🌳';
    case 'shop':
      return '🛒';
    default:
      return '📍';
  }
}
