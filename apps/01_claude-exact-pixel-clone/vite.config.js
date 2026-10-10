import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Dev server config.
 *
 * Two things matter here:
 *
 * 1. host 0.0.0.0 + allowedHosts — so the app also works when it is opened
 *    through a forwarded/proxied hostname, not only 127.0.0.1.
 *    start-app.bat still passes --host 127.0.0.1 for the local Windows run.
 *
 * 2. /ollama + /vault proxies — this is what kills the Ollama CORS problem.
 *    The browser calls same-origin /ollama/api/chat, Vite forwards it to
 *    127.0.0.1:11434 server-side, so OLLAMA_ORIGINS no longer matters.
 *    The app auto-detects the proxy via /__ai_proxy_ping and falls back to a
 *    direct connection when it is not available (e.g. a static build).
 */
const proxyPing = {
  name: 'ai-assistant-proxy-ping',
  configureServer(server) {
    server.middlewares.use('/__ai_proxy_ping', (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: true, proxy: true }))
    })
  },
}

export default defineConfig({
  plugins: [react(), proxyPing],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/ollama': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ollama/, ''),
      },
      '/vault': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/vault/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
  },
})
