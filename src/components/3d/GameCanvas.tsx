import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { Suspense } from 'react';
import { ErrorBoundary, SceneErrorFallback } from '../ErrorBoundary';
import { World } from './World';
import { LoadingScene } from './LoadingScene';
import { CAMERA_CONFIG } from '@/constants';

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
];

export function GameCanvas() {
  return (
    <ErrorBoundary fallback={<SceneErrorFallback />}>
      <KeyboardControls map={keyboardMap}>
        <Canvas
          shadows="soft"
          dpr={[1, 1.5]}
          performance={{ min: 0.5 }}
          camera={{
            position: [0, CAMERA_CONFIG.height, CAMERA_CONFIG.distance],
            fov: CAMERA_CONFIG.fov,
          }}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={<LoadingScene />}>
            <World />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </ErrorBoundary>
  );
}
