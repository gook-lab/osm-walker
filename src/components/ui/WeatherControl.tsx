import { useTimeOfDay, useWeather, useStore } from '@/stores';
import type { WeatherType } from '@/stores/slices/weatherSlice';

/**
 * 날씨/시간 컨트롤 패널
 */
export function WeatherControl() {
  const timeOfDay = useTimeOfDay();
  const weather = useWeather();
  const setTimeOfDay = useStore(state => state.setTimeOfDay);
  const setWeather = useStore(state => state.setWeather);

  const timeEmoji = getTimeEmoji(timeOfDay);

  return (
    <div className="pointer-events-auto absolute left-4 bottom-16 sm:bottom-20">
      <div className="rounded-lg bg-slate-900/80 p-3 text-white backdrop-blur-sm">
        {/* 시간 슬라이더 */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>{timeEmoji} {formatTime(timeOfDay)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="24"
            step="0.5"
            value={timeOfDay}
            onChange={e => setTimeOfDay(parseFloat(e.target.value))}
            className="w-32 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* 날씨 선택 */}
        <div className="flex gap-1">
          <WeatherButton
            emoji="☀️"
            weather="clear"
            current={weather}
            onClick={() => setWeather('clear')}
          />
          <WeatherButton
            emoji="🌧️"
            weather="rain"
            current={weather}
            onClick={() => setWeather('rain')}
          />
          <WeatherButton
            emoji="❄️"
            weather="snow"
            current={weather}
            onClick={() => setWeather('snow')}
          />
        </div>
      </div>
    </div>
  );
}

interface WeatherButtonProps {
  emoji: string;
  weather: WeatherType;
  current: WeatherType;
  onClick: () => void;
}

function WeatherButton({ emoji, weather, current, onClick }: WeatherButtonProps) {
  const isActive = weather === current;
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded text-lg transition-all ${
        isActive
          ? 'bg-blue-500 scale-110'
          : 'bg-slate-700 hover:bg-slate-600'
      }`}
    >
      {emoji}
    </button>
  );
}

function getTimeEmoji(time: number): string {
  if (time >= 6 && time < 12) return '🌅';
  if (time >= 12 && time < 18) return '☀️';
  if (time >= 18 && time < 21) return '🌆';
  return '🌙';
}

function formatTime(time: number): string {
  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
