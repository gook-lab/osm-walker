import type { StateCreator } from 'zustand';

export type WeatherType = 'clear' | 'rain' | 'snow';

export interface WeatherSlice {
  // 상태
  timeOfDay: number; // 0-24
  weather: WeatherType;
  isAutoTime: boolean;

  // 액션
  setTimeOfDay: (time: number) => void;
  setWeather: (weather: WeatherType) => void;
  toggleAutoTime: () => void;
}

export const createWeatherSlice: StateCreator<WeatherSlice, [], [], WeatherSlice> = (
  set,
) => ({
  // 초기 상태 (밤 20시)
  timeOfDay: 20,
  weather: 'clear',
  isAutoTime: false,

  // 액션
  setTimeOfDay: timeOfDay => set({ timeOfDay: timeOfDay % 24 }),
  setWeather: weather => set({ weather }),
  toggleAutoTime: () => set(state => ({ isAutoTime: !state.isAutoTime })),
});
