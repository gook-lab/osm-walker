import { create } from 'zustand';
import { createMapSlice, type MapSlice } from './slices/mapSlice';
import { createSearchSlice, type SearchSlice } from './slices/searchSlice';
import { createWeatherSlice, type WeatherSlice } from './slices/weatherSlice';
import { createCharacterSlice, type CharacterSlice } from './slices/characterSlice';

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
export const useMapActions = () =>
  useStore(state => ({
    setCenter: state.setCenter,
    setBuildings: state.setBuildings,
    setPOIs: state.setPOIs,
    setSelectedPOI: state.setSelectedPOI,
    clearMap: state.clearMap,
  }));

export const useSearchActions = () =>
  useStore(state => ({
    setQuery: state.setQuery,
    setLoading: state.setLoading,
    setError: state.setError,
    resetSearch: state.resetSearch,
  }));
