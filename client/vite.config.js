import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // All /api requests forwarded to your Express server
      '/api': {
        target:       'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})