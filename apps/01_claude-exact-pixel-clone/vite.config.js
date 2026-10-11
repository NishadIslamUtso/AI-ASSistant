import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import proxyPolicy from './server/proxy-policy.cjs'
const localApiBoundary = {
  name: 'local-api-boundary',
  configureServer(server) { server.middlewares.use(proxyPolicy.protectLocalApi) },
  configurePreviewServer(server) { server.middlewares.use(proxyPolicy.protectLocalApi) },
}

// The browser always uses this origin. This also works behind Arena's HTTPS
// preview; 127.0.0.1 below refers to the machine running Vite, never the browser.
const proxy = {
  '/api/ollama': {
    target: proxyPolicy.localTarget(process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434', 'OLLAMA_API_URL'),
    changeOrigin: true,
    rewrite: path => path.replace(/^\/api\/ollama/, '/api'),
    configure(proxy) {
      proxy.on('proxyReq', request => {
        // This is a server-to-server local request, not a browser CORS request.
        request.removeHeader('origin'); request.removeHeader('cookie'); request.removeHeader('authorization')
      })
      proxy.on('error', (_error, _request, response) => {
        if (response && !response.headersSent && response.writeHead) {
          response.writeHead(503, { 'Content-Type': 'application/json' })
          response.end(JSON.stringify({ error: 'Ollama is not reachable on this machine at port 11434. Start the existing Ollama installation; no model download is needed.' }))
        }
      })
    },
  },
  '/api/vault': {
    target: proxyPolicy.localTarget(process.env.VAULT_API_URL || 'http://127.0.0.1:8765', 'VAULT_API_URL'),
    changeOrigin: true,
    rewrite: path => path.replace(/^\/api\/vault/, '') || '/',
    configure(proxy) {
      proxy.on('proxyReq', request => { request.removeHeader('cookie'); request.removeHeader('authorization') })
    },
  },
}

// A sandboxed artifact cannot navigate its frame to an external site either.
// Inline srcdoc still works with frame-src 'none'; ALL frame navigations,
// including same-origin API URLs and blob escapes, are denied.
const headers = { 'Content-Security-Policy': "frame-src 'none'; object-src 'none'; base-uri 'self'" }
export default defineConfig({
  plugins: [localApiBoundary, react()],
  server: { host: '0.0.0.0', port: 5173, strictPort: true, allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'], proxy, headers },
  preview: { host: '0.0.0.0', port: 5173, strictPort: true, allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'], proxy, headers },
})
