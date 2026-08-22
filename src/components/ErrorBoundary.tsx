import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Scene Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function SceneErrorFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 text-white">
      <div className="text-6xl">😵</div>
      <h2 className="mt-4 text-xl font-bold">3D 씬 로딩 실패</h2>
      <p className="mt-2 text-slate-400">
        WebGL을 지원하지 않거나 오류가 발생했습니다.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-700"
      >
        새로고침
      </button>
    </div>
  );
}
