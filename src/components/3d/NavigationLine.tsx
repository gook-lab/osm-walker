import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSelectedPOI } from '@/stores';

/**
 * 선택된 POI까지 네비게이션 라인을 표시
 */
export function NavigationLine() {
  const selectedPOI = useSelectedPOI();

  // POI가 선택되지 않으면 렌더링하지 않음
  if (!selectedPOI) return null;

  return <NavigationLineInner targetX={selectedPOI.position.x} targetZ={selectedPOI.position.z} />;
}

interface NavigationLineInnerProps {
  targetX: number;
  targetZ: number;
}

function NavigationLineInner({ targetX, targetZ }: NavigationLineInnerProps) {
  // 플레이어 위치 (0,0에서 시작 - 실제로는 캐릭터 위치 추적 필요)
  const playerPos = useRef({ x: 0, z: 0 });

  // 점선 애니메이션을 위한 ref
  const dashOffset = useRef(0);

  useFrame(({ camera }) => {
    // 카메라 위치를 대략적인 플레이어 위치로 사용
    playerPos.current.x = camera.position.x;
    playerPos.current.z = camera.position.z;

    // 점선 애니메이션
    dashOffset.current += 0.05;
  });

  // 라인 포인트 생성 (곡선으로)
  const points = useMemo(() => {
    const start = new THREE.Vector3(0, 0.3, 0);
    const end = new THREE.Vector3(targetX, 0.3, targetZ);

    // 베지어 곡선으로 부드러운 경로
    const mid = new THREE.Vector3(
      (start.x + end.x) / 2,
      2, // 중간점을 약간 높게
      (start.z + end.z) / 2
    );

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(20);
  }, [targetX, targetZ]);

  return (
    <group>
      {/* 메인 네비게이션 라인 */}
      <Line
        points={points}
        color="#00ff88"
        lineWidth={3}
        dashed
        dashScale={2}
        dashSize={0.5}
        dashOffset={dashOffset.current}
      />

      {/* 목적지 마커 */}
      <group position={[targetX, 0.5, targetZ]}>
        {/* 바닥 원 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1, 32]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>

        {/* 펄스 효과 */}
        <PulsingCircle />
      </group>
    </group>
  );
}

/**
 * 펄스 효과 원
 */
function PulsingCircle() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 3) * 0.3;
      meshRef.current.scale.setScalar(scale);

      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.5 - Math.sin(clock.elapsedTime * 3) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <circleGeometry args={[1.5, 32]} />
      <meshBasicMaterial color="#00ff88" transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}
