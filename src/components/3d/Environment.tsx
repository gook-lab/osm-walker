import { useThree } from '@react-three/fiber';
import { useMemo, useEffect } from 'react';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useTimeOfDay } from '@/stores';
import { getSkyColor } from './WeatherEffects';

export function Environment() {
  const { scene } = useThree();
  const timeOfDay = useTimeOfDay();

  // 시간 변경 시에만 하늘색 업데이트 (성능 최적화)
  useEffect(() => {
    const skyColor = getSkyColor(timeOfDay);
    scene.background = new THREE.Color(skyColor);
  }, [scene, timeOfDay]);

  // 시간대별 조명 설정 계산
  const lighting = useMemo(() => {
    const isNight = timeOfDay < 6 || timeOfDay >= 20;
    const isDusk = timeOfDay >= 18 && timeOfDay < 20;
    const isDawn = timeOfDay >= 6 && timeOfDay < 8;

    if (isNight) {
      return {
        ambient: { intensity: 0.15, color: '#4a5080' },
        main: { intensity: 0.3, color: '#c4d4e8' },
        accent: { intensity: 0.1, color: '#8b5cf6' },
        cityGlow: 0.2,
        showMoon: true,
        showStars: true,
      };
    } else if (isDusk || isDawn) {
      return {
        ambient: { intensity: 0.3, color: '#ffb088' },
        main: { intensity: 0.5, color: '#ffd4a3' },
        accent: { intensity: 0.15, color: '#ff8866' },
        cityGlow: 0.1,
        showMoon: isDusk,
        showStars: false,
      };
    } else {
      // 낮
      return {
        ambient: { intensity: 0.4, color: '#ffffff' },
        main: { intensity: 0.8, color: '#fffef0' },
        accent: { intensity: 0.2, color: '#87CEEB' },
        cityGlow: 0,
        showMoon: false,
        showStars: false,
      };
    }
  }, [timeOfDay]);

  return (
    <>
      {/* 환경광 */}
      <ambientLight intensity={lighting.ambient.intensity} color={lighting.ambient.color} />

      {/* 메인 조명 (태양/달) */}
      <directionalLight
        position={[50, 100, 50]}
        intensity={lighting.main.intensity}
        color={lighting.main.color}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* 보조 조명 */}
      <directionalLight
        position={[-30, 50, -30]}
        intensity={lighting.accent.intensity}
        color={lighting.accent.color}
      />

      {/* 도시 불빛 반사 (밤에만) */}
      {lighting.cityGlow > 0 && (
        <pointLight position={[0, -10, 0]} intensity={lighting.cityGlow} color="#ffd700" distance={100} />
      )}

      {/* 달 (밤에만) */}
      {lighting.showMoon && <Moon />}

      {/* 별 (밤에만) */}
      {lighting.showStars && (
        <Stars
          radius={200}
          depth={50}
          count={500}
          factor={3}
          saturation={0.3}
          fade
          speed={0}
        />
      )}

      {/* 안개 효과 (밤에는 어둡게, 낮에는 밝게) */}
      <fog attach="fog" args={[timeOfDay >= 8 && timeOfDay < 18 ? '#d0e8f8' : '#0a0a1a', 80, 250]} />
    </>
  );
}

/**
 * 달 컴포넌트
 */
function Moon() {
  // 달 위치 (오른쪽 상단)
  const position = useMemo<[number, number, number]>(() => [80, 120, -50], []);

  return (
    <group position={position}>
      {/* 달 본체 */}
      <mesh>
        <sphereGeometry args={[8, 32, 32]} />
        <meshStandardMaterial
          color="#fffacd"
          emissive="#fffacd"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* 달 광채 (glow effect) */}
      <mesh scale={1.3}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color="#fffacd" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
