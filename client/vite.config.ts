import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The client is served from the root path by the Node server in production.
// In dev, proxy /api to the local Express server so the TTS endpoint works.
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
