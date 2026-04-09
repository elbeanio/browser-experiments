import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// GitHub Pages deployment base path
const base = process.env.NODE_ENV === 'production' ? '/browser-experiments/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@browser-experiments/core': path.resolve(__dirname, '../../packages/core/src'),
    },
  },
});