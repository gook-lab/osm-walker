import { useCallback } from 'react';
import { useStore } from '@/stores';
import { geocode } from '@/lib/geocoding';
import { fetchMapData } from '@/lib/overpass';
import { parseBuildings, parsePOIs, parseRoads } from '@/utils/osmParser';
import { DEFAULT_RADIUS } from '@/constants';

/**
 * 검색 기능 훅
 */
export function useSearch() {
  const setQuery = useStore(state => state.setQuery);
  const setLoading = useStore(state => state.setLoading);
  const setError = useStore(state => state.setError);
  const setCenter = useStore(state => state.setCenter);
  const setBuildings = useStore(state => state.setBuildings);
  const setPOIs = useStore(state => state.setPOIs);
  const setRoads = useStore(state => state.setRoads);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setError('검색어를 입력해주세요.');
        return;
      }

      setQuery(query);
      setLoading(true);
      setError(null);

      try {
        // 1. Geocoding: 텍스트 → 좌표
        const geocodeResult = await geocode(query);

        if (!geocodeResult) {
          setError('검색 결과가 없습니다. 다른 검색어를 시도해보세요.');
          setLoading(false);
          return;
        }

        const center = geocodeResult.position;
        setCenter(center);

        // 2. Overpass API: 좌표 → 지도 데이터
        const overpassData = await fetchMapData(center, DEFAULT_RADIUS);

        // 3. 파싱: OSM 데이터 → Building/POI/Road
        const buildings = parseBuildings(overpassData, center);
        const pois = parsePOIs(overpassData, center);
        const roads = parseRoads(overpassData, center);

        setBuildings(buildings);
        setPOIs(pois);
        setRoads(roads);

        console.log(
          `검색 완료: ${buildings.length}개 건물, ${pois.length}개 POI, ${roads.length}개 도로`,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setError(message);
        console.error('검색 오류:', err);
      } finally {
        setLoading(false);
      }
    },
    [setQuery, setLoading, setError, setCenter, setBuildings, setPOIs, setRoads],
  );

  return { search };
}
