import { useMemo, useState, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { usePOIs, useStore } from '@/stores';
import { POIMarker } from './POIMarker';
import type { POI } from '@/types';

const MAX_VISIBLE_DISTANCE = 100; // 100m 이내 POI만 표시
const MAX_POIS_RENDERED = 30; // 최대 렌더링 POI 수

/**
 * 모든 POI를 렌더링하는 컨테이너 컴포넌트
 * 성능 최적화: 거리 기반 컬링 적용
 */
export function POIs() {
  const pois = usePOIs();
  const setSelectedPOI = useStore(state => state.setSelectedPOI);
  const { camera } = useThree();
  const [visiblePOIs, setVisiblePOIs] = useState<readonly POI[]>([]);
  const frameCount = useRef(0);

  // 카메라 위치 기반 POI 필터링 (45프레임마다 - 성능 최적화)
  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 45 !== 0) return;
    if (pois.length === 0) return;

    const cameraX = camera.position.x;
    const cameraZ = camera.position.z;

    // 거리 기반 정렬 및 필터링
    const sorted = [...pois]
      .map(poi => ({
        poi,
        distance: Math.sqrt(
          Math.pow(poi.position.x - cameraX, 2) +
          Math.pow(poi.position.z - cameraZ, 2)
        ),
      }))
      .filter(item => item.distance < MAX_VISIBLE_DISTANCE)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_POIS_RENDERED)
      .map(item => item.poi);

    // 변경이 있을 때만 업데이트
    if (sorted.length !== visiblePOIs.length ||
        sorted.some((poi, i) => poi.id !== visiblePOIs[i]?.id)) {
      setVisiblePOIs(sorted);
    }
  });

  const handlePOIClick = useMemo(() => (poi: POI) => {
    setSelectedPOI(poi);
  }, [setSelectedPOI]);

  if (visiblePOIs.length === 0) {
    return null;
  }

  return (
    <group name="pois">
      {visiblePOIs.map(poi => (
        <POIMarker key={poi.id} poi={poi} onClick={handlePOIClick} />
      ))}
    </group>
  );
}
