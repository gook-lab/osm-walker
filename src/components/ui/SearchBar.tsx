import { useState, useCallback, type KeyboardEvent } from 'react';
import { useIsLoading, useError } from '@/stores';
import { useSearch } from '@/hooks/useSearch';

export function SearchBar() {
  const [inputValue, setInputValue] = useState('');
  const isLoading = useIsLoading();
  const error = useError();
  const { search } = useSearch();

  const handleSearch = useCallback(() => {
    if (inputValue.trim() && !isLoading) {
      search(inputValue.trim());
    }
  }, [inputValue, isLoading, search]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch],
  );

  return (
    <div className="pointer-events-auto flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="장소 검색 (예: 강남역)"
          disabled={isLoading}
          className="w-full rounded-lg bg-slate-800/80 px-3 py-2 text-sm text-white placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 sm:w-64 sm:px-4 sm:text-base"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !inputValue.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner />
              검색 중...
            </span>
          ) : (
            '🔍 검색'
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/80 px-4 py-2 text-sm text-white backdrop-blur-sm">
          <span>⚠️ {error}</span>
          <button
            onClick={handleSearch}
            className="rounded bg-white/20 px-2 py-1 text-xs hover:bg-white/30"
          >
            재시도
          </button>
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
