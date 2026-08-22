import { EffectComposer, Vignette } from '@react-three/postprocessing';

/**
 * 포스트프로세싱 효과 (성능 최적화)
 * - Bloom 제거 (GPU 부하 큼)
 * - Vignette만 유지 (가벼움)
 */
export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      {/* 비네트 효과 - 가장자리 어둡게 */}
      <Vignette offset={0.3} darkness={0.4} />
    </EffectComposer>
  );
}
