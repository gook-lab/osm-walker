import { Suspense, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';

interface FBXModelLoaderProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}

/**
 * FBX 모델 로더 컴포넌트
 */
export function FBXModelLoader({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: FBXModelLoaderProps) {
  return (
    <Suspense fallback={<LoadingBox position={position} />}>
      <FBXModel url={url} position={position} rotation={rotation} scale={scale} />
    </Suspense>
  );
}

function FBXModel({ url, position, rotation, scale }: FBXModelLoaderProps) {
  const fbx = useLoader(FBXLoader, url);

  // 복제하여 여러 인스턴스에서 사용 가능하게
  const clonedScene = useMemo(() => {
    const clone = fbx.clone();

    // 그림자 설정 (성능 최적화: castShadow 비활성화)
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = true;

        // 머티리얼이 없으면 기본 머티리얼 적용
        if (!child.material) {
          child.material = new THREE.MeshStandardMaterial({
            color: '#E8E8E8',
            roughness: 0.8,
          });
        }
      }
    });

    return clone;
  }, [fbx]);

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

function LoadingBox({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#666666" wireframe />
    </mesh>
  );
}

/**
 * FBX 모델 프리로딩
 */
export function preloadFBX(url: string) {
  const loader = new FBXLoader();
  loader.loadAsync(url);
}
