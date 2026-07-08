import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    proxy: {
      '/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/anthropic/, ''),
      },
    },
  },
  build: {
    outDir: 'C:/Users/wooye/AndroidStudioProjects/meomeok/app/src/main/assets/www',
    emptyOutDir: true,  // 빌드 전 자동으로 www 폴더 비워줌
    sourcemap: true,     // source map 생성 (디버깅용)
  }
})