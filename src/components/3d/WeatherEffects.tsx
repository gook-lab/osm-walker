import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWeather } from '@/stores';

const PARTICLE_COUNT = 300;
const AREA_SIZE = 60;

/**
 * 날씨 효과 컴포넌트
 * 비/눈 파티클 시스템
 */
export function WeatherEffects() {
  const weather = useWeather();

  if (weather === 'clear') return null;

  return weather === 'rain' ? <RainEffect /> : <SnowEffect />;
}

/**
 * 비 효과
 */
function RainEffect() {
  const pointsRef = useRef<THREE.Points>(null);
  const frameSkip = useRef(0);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * AREA_SIZE;
      pos[i * 3 + 1] = Math.random() * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * AREA_SIZE;
      vel[i] = 0.5 + Math.random() * 0.5;
    }

    return [pos, vel] as const;
  }, []);

  useFrame(() => {
    frameSkip.current++;
    if (frameSkip.current % 2 !== 0) return;

    if (!pointsRef.current) return;
    const positionAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    if (!positionAttr) return;
    const posArray = positionAttr.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      posArray[idx + 1]! -= velocities[i]!;

      if (posArray[idx + 1]! < 0) {
        posArray[idx + 1] = 50;
        posArray[idx] = (Math.random() - 0.5) * AREA_SIZE;
        posArray[idx + 2] = (Math.random() - 0.5) * AREA_SIZE;
      }
    }

    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#87CEEB"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * 눈 효과
 */
function SnowEffect() {
  const pointsRef = useRef<THREE.Points>(null);
  const frameSkip = useRef(0);

  const [positions, velocities, drifts] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT);
    const drf = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * AREA_SIZE;
      pos[i * 3 + 1] = Math.random() * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * AREA_SIZE;
      vel[i] = 0.05 + Math.random() * 0.05;
      drf[i] = Math.random() * Math.PI * 2;
    }

    return [pos, vel, drf] as const;
  }, []);

  useFrame(({ clock }) => {
    frameSkip.current++;
    if (frameSkip.current % 2 !== 0) return;

    if (!pointsRef.current) return;
    const positionAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    if (!positionAttr) return;
    const posArray = positionAttr.array as Float32Array;
    const time = clock.getElapsedTime();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      posArray[idx + 1]! -= velocities[i]!;
      posArray[idx]! += Math.sin(time + drifts[i]!) * 0.01;

      if (posArray[idx + 1]! < 0) {
        posArray[idx + 1] = 50;
        posArray[idx] = (Math.random() - 0.5) * AREA_SIZE;
        posArray[idx + 2] = (Math.random() - 0.5) * AREA_SIZE;
      }
    }

    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * 시간에 따른 하늘색 계산
 */
export function getSkyColor(timeOfDay: number): string {
  if (timeOfDay < 6 || timeOfDay >= 22) {
    return '#0a0a1a';
  }
  if (timeOfDay >= 6 && timeOfDay < 8) {
    const t = (timeOfDay - 6) / 2;
    return lerpColor('#0a0a1a', '#87CEEB', t);
  }
  if (timeOfDay >= 8 && timeOfDay < 18) {
    return '#87CEEB';
  }
  if (timeOfDay >= 18 && timeOfDay < 20) {
    const t = (timeOfDay - 18) / 2;
    return lerpColor('#FF7F50', '#1a1a3a', t);
  }
  if (timeOfDay >= 20 && timeOfDay < 22) {
    const t = (timeOfDay - 20) / 2;
    return lerpColor('#1a1a3a', '#0a0a1a', t);
  }

  return '#0a0a1a';
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  const r1 = (c1 >> 16) & 255;
  const g1 = (c1 >> 8) & 255;
  const b1 = c1 & 255;

  const r2 = (c2 >> 16) & 255;
  const g2 = (c2 >> 8) & 255;
  const b2 = c2 & 255;

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
