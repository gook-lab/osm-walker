import type { ReactElement } from 'react';
import { useSelectedPOI, useStore } from '@/stores';
import { POI_COLORS } from '@/constants';
import type { POI } from '@/types';

/**
 * POI 정보 패널 컴포넌트
 */
export function POIInfoPanel() {
  const selectedPOI = useSelectedPOI();
  const setSelectedPOI = useStore(state => state.setSelectedPOI);

  if (!selectedPOI) return null;

  const handleClose = () => {
    setSelectedPOI(null);
  };

  return (
    <div className="pointer-events-auto absolute bottom-16 left-2 right-2 sm:bottom-20 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
      <div className="w-full rounded-xl bg-slate-900/90 p-3 text-white shadow-2xl backdrop-blur-md sm:min-w-64 sm:w-auto sm:p-4">
        {/* 헤더 */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
              style={{ backgroundColor: POI_COLORS[selectedPOI.category] || POI_COLORS.default }}
            >
              {getCategoryEmoji(selectedPOI.category)}
            </span>
            <div>
              <h3 className="font-bold">{selectedPOI.name || '이름 없음'}</h3>
              <p className="text-xs text-slate-400">{getCategoryName(selectedPOI.category)}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 상세 정보 */}
        <div className="space-y-2 text-sm">
          {renderDetails(selectedPOI)}
        </div>

        {/* 좌표 */}
        <div className="mt-3 border-t border-slate-700 pt-2 text-xs text-slate-500">
          📍 {selectedPOI.originalPosition.lat.toFixed(6)}, {selectedPOI.originalPosition.lng.toFixed(6)}
        </div>
      </div>
    </div>
  );
}

/**
 * POI 상세 정보 렌더링
 */
function renderDetails(poi: POI) {
  const details: ReactElement[] = [];

  if (poi.category === 'restaurant' && 'cuisine' in poi && poi.cuisine) {
    details.push(
      <div key="cuisine" className="flex items-center gap-2">
        <span className="text-slate-400">요리:</span>
        <span>{poi.cuisine}</span>
      </div>
    );
  }

  if ('openingHours' in poi && poi.openingHours) {
    details.push(
      <div key="hours" className="flex items-center gap-2">
        <span className="text-slate-400">영업시간:</span>
        <span>{poi.openingHours}</span>
      </div>
    );
  }

  if (poi.category === 'subway' && 'lines' in poi && poi.lines && poi.lines.length > 0) {
    details.push(
      <div key="lines" className="flex items-center gap-2">
        <span className="text-slate-400">노선:</span>
        <span>{poi.lines.join(', ')}</span>
      </div>
    );
  }

  if (poi.category === 'bus_stop' && 'routes' in poi && poi.routes && poi.routes.length > 0) {
    details.push(
      <div key="routes" className="flex items-center gap-2">
        <span className="text-slate-400">버스:</span>
        <span>{poi.routes.join(', ')}</span>
      </div>
    );
  }

  if (details.length === 0) {
    return <p className="text-slate-400">상세 정보가 없습니다</p>;
  }

  return details;
}

/**
 * 카테고리별 이모지
 */
function getCategoryEmoji(category: POI['category']): string {
  switch (category) {
    case 'restaurant': return '🍽️';
    case 'cafe': return '☕';
    case 'bar': return '🍺';
    case 'subway': return '🚇';
    case 'bus_stop': return '🚌';
    case 'park': return '🌳';
    case 'shop': return '🛒';
    default: return '📍';
  }
}

/**
 * 카테고리 한글 이름
 */
function getCategoryName(category: POI['category']): string {
  switch (category) {
    case 'restaurant': return '음식점';
    case 'cafe': return '카페';
    case 'bar': return '바';
    case 'subway': return '지하철역';
    case 'bus_stop': return '버스 정류장';
    case 'park': return '공원';
    case 'shop': return '상점';
    default: return '장소';
  }
}
