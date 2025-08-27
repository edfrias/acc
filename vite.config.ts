import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        // Optimize chunk splitting for better caching
        manualChunks: {
          vendor: ['vue'],
          i18n: ['vue-i18n']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Enable compression and optimization
    cssCodeSplit: true,
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000
  },
  server: {
    host: true,
    port: 3000
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['vue', 'vue-i18n']
  }
})
