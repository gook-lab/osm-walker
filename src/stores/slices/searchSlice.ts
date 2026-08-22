import type { StateCreator } from 'zustand';

export interface SearchSlice {
  // 상태
  query: string;
  isLoading: boolean;
  error: string | null;

  // 액션
  setQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetSearch: () => void;
}

export const createSearchSlice: StateCreator<
  SearchSlice,
  [],
  [],
  SearchSlice
> = set => ({
  // 초기 상태
  query: '',
  isLoading: false,
  error: null,

  // 액션
  setQuery: query => set({ query }),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
  resetSearch: () => set({ query: '', isLoading: false, error: null }),
});
