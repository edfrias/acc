/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 3001
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts']
  }
})
