import { useIsLoading } from '@/stores';

/**
 * 로딩 오버레이 컴포넌트
 */
export function LoadingOverlay() {
  const isLoading = useIsLoading();

  if (!isLoading) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-xl bg-slate-900/90 p-6 text-white shadow-2xl">
        {/* 로딩 스피너 */}
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500" />
          <div className="absolute inset-2 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>

        {/* 로딩 텍스트 */}
        <div className="text-center">
          <p className="font-bold">지도 데이터 로딩 중</p>
          <p className="mt-1 text-sm text-slate-400">건물과 POI를 가져오고 있습니다...</p>
        </div>

        {/* 진행 상태 힌트 */}
        <div className="text-xs text-slate-500">
          첫 번째 서버가 느리면 다른 서버로 시도합니다
        </div>
      </div>
    </div>
  );
}
