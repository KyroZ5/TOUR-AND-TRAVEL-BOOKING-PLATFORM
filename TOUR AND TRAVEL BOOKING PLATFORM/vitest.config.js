import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Offline unit + component tests. Mode "test" loads .env.test with dummy
// Firebase values so modules importing src/firebase/firebase.js are safe.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: [
      'src/**/*.test.{js,jsx}',
      'tests/unit/**/*.test.{js,jsx}',
      'tests/component/**/*.test.{js,jsx}',
    ],
    restoreMocks: true,
  },
});
