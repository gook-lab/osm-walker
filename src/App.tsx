import { GameCanvas } from './components/3d/GameCanvas';
import { SearchBar } from './components/ui/SearchBar';
import { POIInfoPanel } from './components/ui/POIInfoPanel';
import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { Minimap } from './components/ui/Minimap';
import { WeatherControl } from './components/ui/WeatherControl';
import { CharacterCustomizer } from './components/ui/CharacterCustomizer';
import { PerformanceMonitor } from './components/ui/PerformanceMonitor';
import { useBuildings, usePOIs, useCenter, usePlayerPosition } from './stores';

function App() {
  const buildings = useBuildings();
  const pois = usePOIs();
  const center = useCenter();
  const playerPosition = usePlayerPosition();

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* 3D Canvas */}
      <GameCanvas />

      {/* 로딩 오버레이 */}
      <LoadingOverlay />

      {/* UI Overlay */}
      <div className="pointer-events-none absolute inset-0">
        {/* 상단 검색바 (모바일: 전체 너비, 데스크탑: 좌측) */}
        <div className="absolute left-2 right-2 top-2 flex flex-col gap-2 sm:left-4 sm:right-auto sm:top-4 sm:gap-3">
          <SearchBar />

          {/* 검색 결과 정보 */}
          {center && (
            <div className="pointer-events-none rounded-lg bg-black/50 p-2 text-xs text-white backdrop-blur-sm">
              <span className="hidden sm:inline">📍 {center.lat.toFixed(4)}, {center.lng.toFixed(4)} | </span>
              🏢 {buildings.length} | 📌 {pois.length}
            </div>
          )}
        </div>

        {/* 우측 상단 조작법 (모바일: 숨김) */}
        <div className="absolute right-4 top-4 hidden rounded-lg bg-black/50 p-3 text-sm text-white backdrop-blur-sm sm:block">
          <p className="font-bold">🎮 조작법</p>
          <p className="mt-1 text-xs text-slate-300">
            WASD: 이동 | Shift: 달리기 | 마우스: 시점
          </p>
        </div>

        {/* 캐릭터 커스터마이저 */}
        <CharacterCustomizer />

        {/* 모바일 조작법 힌트 (터치 스크린) */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-lg bg-black/50 px-3 py-2 text-xs text-white backdrop-blur-sm sm:hidden">
          👆 터치: 이동 | 🔄 드래그: 시점
        </div>

        {/* 하단 타이틀 */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-lg bg-black/50 px-3 py-1.5 text-white backdrop-blur-sm sm:bottom-4 sm:px-4 sm:py-2">
          <p className="text-center text-xs sm:text-sm">
            🏙️ <span className="font-bold">3D Map Explorer</span>
          </p>
        </div>

        {/* POI 정보 패널 */}
        <POIInfoPanel />

        {/* 날씨/시간 컨트롤 */}
        <WeatherControl />

        {/* 미니맵 */}
        <Minimap playerPosition={playerPosition} />

        {/* 성능 모니터 (개발 모드) */}
        {import.meta.env.DEV && <PerformanceMonitor />}
      </div>
    </div>
  );
}

export default App;
