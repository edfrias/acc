/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Se publica en arquerscastelldefels.com/carnets/, dentro del sitio de la web (ver firebase.json)
  base: '/carnets/',
  plugins: [vue(), tailwindcss()],
  server: {
    host: true,
    port: 3001
  },
  test: {
    environment: 'jsdom',
    include: ['tests/*.test.ts']
  }
})
