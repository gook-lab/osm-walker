import { useState, useEffect } from 'react';

/**
 * FPS 모니터 컴포넌트
 */
export function PerformanceMonitor() {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        setFps(Math.round(frameCount * 1000 / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const fpsColor = fps >= 50 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="absolute right-4 bottom-4 rounded bg-black/60 px-2 py-1 text-xs font-mono text-white backdrop-blur-sm">
      <span className={fpsColor}>{fps}</span> FPS
    </div>
  );
}
