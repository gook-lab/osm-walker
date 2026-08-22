import { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ModelLoaderProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}

/**
 * GLTF 모델 로더 컴포넌트
 *
 * 사용 예시:
 * <ModelLoader url="/models/building.glb" position={[0, 0, 0]} scale={0.5} />
 *
 * 무료 3D 에셋 다운로드 사이트:
 * - Kenney.nl: https://kenney.nl/assets (로우폴리 게임 에셋)
 * - Poly Pizza: https://poly.pizza (무료 로우폴리 모델)
 * - Quaternius: https://quaternius.com (무료 게임 에셋 팩)
 * - Sketchfab: https://sketchfab.com/features/free-3d-models (일부 무료)
 * - OpenGameArt: https://opengameart.org (오픈소스 에셋)
 */
export function ModelLoader({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: ModelLoaderProps) {
  return (
    <Suspense fallback={<LoadingBox position={position} />}>
      <Model url={url} position={position} rotation={rotation} scale={scale} />
    </Suspense>
  );
}

function Model({ url, position, rotation, scale }: ModelLoaderProps) {
  const { scene } = useGLTF(url);
  const clonedScene = scene.clone();

  // 그림자 설정
  clonedScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const scaleArray = typeof scale === 'number' ? [scale, scale, scale] : scale;

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={scaleArray as [number, number, number]}
    />
  );
}

/**
 * 모델 로딩 중 표시할 박스
 */
function LoadingBox({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#666666" wireframe />
    </mesh>
  );
}

/**
 * 모델 프리로딩 (성능 최적화)
 */
export function preloadModel(url: string) {
  useGLTF.preload(url);
}
