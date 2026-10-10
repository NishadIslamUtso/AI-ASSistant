import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Browser code only talks to relative URLs (/vault/*, /ollama/*).
// Vite proxies them to the local services, so the browser never needs
// localhost CORS exceptions (no OLLAMA_ORIGINS setup needed).
//   /vault/*  -> AI ASSistant vault driver  http://127.0.0.1:8765
//   /ollama/* -> Ollama                      http://127.0.0.1:11434
// Bind address: 127.0.0.1 on Windows by default (start-app.bat).
// Set VITE_HOST=0.0.0.0 only when you deliberately want LAN/preview access.
const host = process.env.VITE_HOST || '127.0.0.1'

const proxy = {
  '/vault': {
    target: 'http://127.0.0.1:8765',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/vault/, ''),
  },
  '/ollama': {
    target: 'http://127.0.0.1:11434',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/ollama/, ''),
    configure: (proxyServer) => {
      // Ollama rejects unknown browser origins; the proxy is server-side, so drop Origin.
      proxyServer.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
    },
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    host,
    port: 5173,
    strictPort: true,
    proxy,
    // Vite 5.4+ blocks unknown Host headers; allow the sandbox preview host explicitly.
    allowedHosts: ['localhost', '127.0.0.1', '.e2b.app'],
  },
  preview: { host, port: 4173, proxy },
})
