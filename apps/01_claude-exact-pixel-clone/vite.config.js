import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/ollama': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/ollama/, '/api'),
      },
      '/vault': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/vault/, ''),
      },
    },
  },
})
