import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        codeSplitting: {
          groups: [
            { name: 'vendor', test: /\/node_modules\/(vue|@vue\/[^/]+)\// },
            { name: 'i18n', test: /\/node_modules\/(vue-i18n|@intlify\/[^/]+)\// }
          ]
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
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  },
  server: {
    host: true,
    port: 3000,
    // Carnets se sirve en /carnets/ igual que en producción: lo atiende su propio servidor (pnpm dev:all)
    proxy: {
      '/carnets': { target: 'http://localhost:3001', ws: true }
    }
  },
  optimizeDeps: {
    include: ['vue', 'vue-i18n']
  }
})
