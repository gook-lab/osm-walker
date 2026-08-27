import { create } from 'zustand';
import { createMapSlice, type MapSlice } from './slices/mapSlice';
import { createSearchSlice, type SearchSlice } from './slices/searchSlice';
import { createWeatherSlice, type WeatherSlice } from './slices/weatherSlice';
import { createCharacterSlice, type CharacterSlice } from './slices/characterSlice';
import { useShallow } from 'zustand/react/shallow';

// 전체 스토어 타입
export type StoreState = MapSlice & SearchSlice & WeatherSlice & CharacterSlice;

// 메인 스토어
export const useStore = create<StoreState>()((...args) => ({
  ...createMapSlice(...args),
  ...createSearchSlice(...args),
  ...createWeatherSlice(...args),
  ...createCharacterSlice(...args),
}));

// 셀렉터 훅들
export const useCenter = () => useStore(state => state.center);
export const useBuildings = () => useStore(state => state.buildings);
export const usePOIs = () => useStore(state => state.pois);
export const useRoads = () => useStore(state => state.roads);
export const useSelectedPOI = () => useStore(state => state.selectedPOI);
export const useQuery = () => useStore(state => state.query);
export const useIsLoading = () => useStore(state => state.isLoading);
export const useError = () => useStore(state => state.error);
export const useTimeOfDay = () => useStore(state => state.timeOfDay);
export const useWeather = () => useStore(state => state.weather);
export const useIsAutoTime = () => useStore(state => state.isAutoTime);
export const useCharacter = () => useStore(state => state.character);
export const usePlayerPosition = () => useStore(state => state.playerPosition);
export const useSetPlayerPosition = () => useStore(state => state.setPlayerPosition);

// 액션 훅들
//
// ⚠️ useShallow 가 필요하다. 셀렉터가 객체 리터럴을 돌려주면 매번 새 참조라
// zustand 가 "바뀌었다"고 보고, **스토어의 어떤 값이 바뀌든** 이 훅을 쓰는
// 컴포넌트가 전부 리렌더된다 (v5 에서는 무한 루프 경고까지 난다).
export const useMapActions = () =>
  useStore(
    useShallow(state => ({
      setCenter: state.setCenter,
      setBuildings: state.setBuildings,
      setPOIs: state.setPOIs,
      setSelectedPOI: state.setSelectedPOI,
      clearMap: state.clearMap,
    }))
  );

export const useSearchActions = () =>
  useStore(
    useShallow(state => ({
      setQuery: state.setQuery,
      setLoading: state.setLoading,
      setError: state.setError,
      resetSearch: state.resetSearch,
    }))
  );
