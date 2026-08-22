import * as THREE from 'three';

/**
 * 머티리얼 풀링 유틸리티
 * 동일한 속성의 머티리얼을 캐싱하여 재사용
 * 메모리 사용량 감소 및 렌더링 성능 향상
 */

interface StandardMaterialProps {
  color: string;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  side?: THREE.Side;
}

interface BasicMaterialProps {
  color: string;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
}

const standardMaterialCache = new Map<string, THREE.MeshStandardMaterial>();
const basicMaterialCache = new Map<string, THREE.MeshBasicMaterial>();

/**
 * 캐시 키 생성
 */
function createKey(props: StandardMaterialProps | BasicMaterialProps): string {
  return JSON.stringify(props);
}

/**
 * MeshStandardMaterial 캐싱
 */
export function getStandardMaterial(props: StandardMaterialProps): THREE.MeshStandardMaterial {
  const key = createKey(props);

  if (!standardMaterialCache.has(key)) {
    const material = new THREE.MeshStandardMaterial({
      color: props.color,
      roughness: props.roughness ?? 0.5,
      metalness: props.metalness ?? 0,
      transparent: props.transparent ?? false,
      opacity: props.opacity ?? 1,
      emissive: props.emissive ? new THREE.Color(props.emissive) : undefined,
      emissiveIntensity: props.emissiveIntensity ?? 0,
      side: props.side ?? THREE.FrontSide,
    });
    standardMaterialCache.set(key, material);
  }

  return standardMaterialCache.get(key)!;
}

/**
 * MeshBasicMaterial 캐싱
 */
export function getBasicMaterial(props: BasicMaterialProps): THREE.MeshBasicMaterial {
  const key = createKey(props);

  if (!basicMaterialCache.has(key)) {
    const material = new THREE.MeshBasicMaterial({
      color: props.color,
      transparent: props.transparent ?? false,
      opacity: props.opacity ?? 1,
      side: props.side ?? THREE.FrontSide,
    });
    basicMaterialCache.set(key, material);
  }

  return basicMaterialCache.get(key)!;
}

/**
 * 캐시 통계 조회 (디버깅용)
 */
export function getMaterialCacheStats(): { standard: number; basic: number } {
  return {
    standard: standardMaterialCache.size,
    basic: basicMaterialCache.size,
  };
}

/**
 * 캐시 초기화 (필요 시)
 */
export function clearMaterialCache(): void {
  standardMaterialCache.forEach(material => material.dispose());
  basicMaterialCache.forEach(material => material.dispose());
  standardMaterialCache.clear();
  basicMaterialCache.clear();
}
