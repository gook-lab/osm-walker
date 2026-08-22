import { useState } from 'react';
import { useCharacter, useStore } from '@/stores';
import { SKIN_COLORS, HAIR_COLORS, CLOTH_COLORS } from '@/stores/slices/characterSlice';

/**
 * 캐릭터 커스터마이징 패널
 */
export function CharacterCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const character = useCharacter();
  const setCharacterCustomization = useStore(state => state.setCharacterCustomization);
  const resetCharacter = useStore(state => state.resetCharacter);

  return (
    <div className="pointer-events-auto absolute right-4 top-14 sm:top-20">
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg bg-slate-900/80 p-2 text-white backdrop-blur-sm hover:bg-slate-800/80"
      >
        👤 캐릭터
      </button>

      {/* 커스터마이징 패널 */}
      {isOpen && (
        <div className="mt-2 w-64 rounded-lg bg-slate-900/90 p-4 text-white backdrop-blur-sm">
          <h3 className="mb-3 font-bold">캐릭터 꾸미기</h3>

          {/* 피부색 */}
          <ColorSelector
            label="👤 피부색"
            colors={SKIN_COLORS}
            selected={character.skinColor}
            onSelect={color => setCharacterCustomization({ skinColor: color })}
          />

          {/* 머리색 */}
          <ColorSelector
            label="💇 머리색"
            colors={HAIR_COLORS}
            selected={character.hairColor}
            onSelect={color => setCharacterCustomization({ hairColor: color })}
          />

          {/* 옷 색상 */}
          <ColorSelector
            label="👕 옷 색상"
            colors={CLOTH_COLORS}
            selected={character.clothColor}
            onSelect={color => setCharacterCustomization({ clothColor: color })}
          />

          {/* 리셋 버튼 */}
          <button
            onClick={resetCharacter}
            className="mt-3 w-full rounded bg-slate-700 py-1 text-sm hover:bg-slate-600"
          >
            초기화
          </button>
        </div>
      )}
    </div>
  );
}

interface ColorSelectorProps {
  label: string;
  colors: readonly string[];
  selected: string;
  onSelect: (color: string) => void;
}

function ColorSelector({ label, colors, selected, onSelect }: ColorSelectorProps) {
  return (
    <div className="mb-3">
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-1">
        {colors.map(color => (
          <button
            key={color}
            onClick={() => onSelect(color)}
            className={`h-6 w-6 rounded-full border-2 transition-all ${
              color === selected ? 'border-white scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}
