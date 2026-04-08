import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build'
  },
  server: {
    port: 5819,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5820',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5820',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
