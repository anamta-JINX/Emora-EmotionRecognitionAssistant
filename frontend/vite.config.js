import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  base: '/app/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/predict_image': 'http://127.0.0.1:5000',
      '/predict_webcam': 'http://127.0.0.1:5000',
      '/health': 'http://127.0.0.1:5000',
    },
  },
});
