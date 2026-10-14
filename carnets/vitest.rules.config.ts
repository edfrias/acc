import { defineConfig } from 'vitest/config'

// Tests de firestore.rules: necesitan el emulador de Firestore (`pnpm test:rules` lo arranca y lo para)
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20_000,
  },
})
