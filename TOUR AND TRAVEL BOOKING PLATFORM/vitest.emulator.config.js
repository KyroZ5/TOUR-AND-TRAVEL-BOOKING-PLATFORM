import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Emulator-backed tests (Firestore/Storage security rules + the booking
// transaction). Run through `firebase emulators:exec`, which injects
// FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST / STORAGE_EMULATOR_HOST.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/rules/**/*.test.js', 'tests/integration/**/*.test.js'],
    setupFiles: ['./tests/emulator-setup.js'],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
