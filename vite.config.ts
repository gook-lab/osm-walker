import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // ⚠️ vite 는 동적 import 의 의존성까지 <link rel="modulepreload"> 로 끌어
    // 올린다. 그대로 두면 GameCanvas 를 지연 로딩해도 3D 청크를 처음부터 전부
    // 받아 버려서 분할한 의미가 없다 (실측: 초기 요청 3.7MB 그대로).
    modulePreload: {
      resolveDependencies: (_url: string, deps: string[]) =>
        deps.filter((d) => !/vendor-(three|physics|drei|fiber|postfx)/.test(d)),
    },
    rollupOptions: {
      output: {
        // 3D 스택은 무겁고 거의 바뀌지 않는다 — 앱 코드와 분리해 캐시가
        // 살아남게 하고, 병렬로 받게 한다. 한 덩어리(3.8MB)면 앱 코드를 한 줄
        // 고쳐도 전부 다시 받아야 한다.
        manualChunks: (id: string) => {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@react-three/rapier') || id.includes('@dimforge'))
            return 'vendor-physics';
          if (id.includes('@react-three/postprocessing') || id.includes('postprocessing'))
            return 'vendor-postfx';
          if (id.includes('@react-three/drei') || id.includes('ecctrl'))
            return 'vendor-drei';
          if (id.includes('@react-three/fiber')) return 'vendor-fiber';
          if (id.includes('/three/')) return 'vendor-three';
          if (id.match(/[\\/]react(-dom)?[\\/]/) || id.includes('scheduler/'))
            return 'vendor-react';
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000,
  },
});
