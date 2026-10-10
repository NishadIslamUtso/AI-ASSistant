import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The browser only talks to same-origin paths (/api/ollama, /api/vault).
// The Vite server forwards them to the local services, so no CORS setup
// (OLLAMA_ORIGINS) is needed and nothing in browser code calls 127.0.0.1.
const proxy = {
  '/api/ollama': {
    target: 'http://127.0.0.1:11434',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/api\/ollama/, ''),
    // Ollama rejects unknown Origins; strip it on the server-side hop.
    configure: (proxyServer) => {
      proxyServer.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
    },
  },
  '/api/vault': {
    target: 'http://127.0.0.1:8765',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/api\/vault/, ''),
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    // Windows start-app.bat passes --host 127.0.0.1 explicitly.
    // Set AI_ASSISTANT_HOST=0.0.0.0 only when you need a preview from another machine.
    host: process.env.AI_ASSISTANT_HOST || '127.0.0.1',
    port: 5173,
    allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'],
    proxy,
  },
  preview: { proxy },
})
