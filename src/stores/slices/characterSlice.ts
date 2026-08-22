import type { StateCreator } from 'zustand';

export interface CharacterCustomization {
  skinColor: string;
  hairColor: string;
  clothColor: string;
  shoeColor: string;
}

export interface PlayerPosition {
  x: number;
  z: number;
}

export interface CharacterSlice {
  // 상태
  character: CharacterCustomization;
  playerPosition: PlayerPosition;

  // 액션
  setCharacterCustomization: (updates: Partial<CharacterCustomization>) => void;
  setPlayerPosition: (position: PlayerPosition) => void;
  resetCharacter: () => void;
}

const DEFAULT_CHARACTER: CharacterCustomization = {
  skinColor: '#FFE5D4',
  hairColor: '#5C4033',
  clothColor: '#87CEEB',
  shoeColor: '#4A4A4A',
};

export const createCharacterSlice: StateCreator<CharacterSlice, [], [], CharacterSlice> = (
  set,
) => ({
  character: DEFAULT_CHARACTER,
  playerPosition: { x: 0, z: 0 },

  setCharacterCustomization: updates =>
    set(state => ({
      character: { ...state.character, ...updates },
    })),

  setPlayerPosition: position => set({ playerPosition: position }),

  resetCharacter: () => set({ character: DEFAULT_CHARACTER, playerPosition: { x: 0, z: 0 } }),
});

// 색상 옵션들
export const SKIN_COLORS = [
  '#FFE5D4', // 밝은 피부
  '#F5D0C5', // 중간
  '#D4A88E', // 올리브
  '#8D5524', // 갈색
  '#4A3728', // 어두운
];

export const HAIR_COLORS = [
  '#5C4033', // 갈색
  '#1a1a1a', // 검정
  '#F4C430', // 금발
  '#8B0000', // 갈적색
  '#FF69B4', // 핑크
  '#4169E1', // 파랑
  '#7CFC00', // 녹색
];

export const CLOTH_COLORS = [
  '#87CEEB', // 하늘색
  '#FF6B6B', // 빨강
  '#98FB98', // 연두
  '#DDA0DD', // 보라
  '#FFD700', // 노랑
  '#FFA500', // 주황
  '#1a1a1a', // 검정
  '#FFFFFF', // 흰색
];
