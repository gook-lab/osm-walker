import type { StateCreator } from 'zustand';
import type { Building, POI, Road, WGS84 } from '@/types';

export interface MapSlice {
  // 상태
  center: WGS84 | null;
  buildings: readonly Building[];
  pois: readonly POI[];
  roads: readonly Road[];
  selectedPOI: POI | null;

  // 액션
  setCenter: (center: WGS84) => void;
  setBuildings: (buildings: readonly Building[]) => void;
  setPOIs: (pois: readonly POI[]) => void;
  setRoads: (roads: readonly Road[]) => void;
  setSelectedPOI: (poi: POI | null) => void;
  clearMap: () => void;
}

export const createMapSlice: StateCreator<MapSlice, [], [], MapSlice> = (
  set,
) => ({
  // 초기 상태
  center: null,
  buildings: [],
  pois: [],
  roads: [],
  selectedPOI: null,

  // 액션
  setCenter: center => set({ center }),
  setBuildings: buildings => set({ buildings }),
  setPOIs: pois => set({ pois }),
  setRoads: roads => set({ roads }),
  setSelectedPOI: selectedPOI => set({ selectedPOI }),
  clearMap: () => set({ center: null, buildings: [], pois: [], roads: [], selectedPOI: null }),
});
