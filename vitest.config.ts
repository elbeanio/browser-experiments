import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts', '**/*.config.*', '**/test-utils/**'],
    },
  },
  resolve: {
    alias: [
      { find: '@browser-experiments/core', replacement: resolve(__dirname, 'packages/core/src') },
      { find: '@browser-experiments/ui', replacement: resolve(__dirname, 'packages/ui/src') },
    ],
  },
});
