import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Same-origin proxies solve TWO long-standing bugs at once:
 *   • Ollama CORS (no more `setx OLLAMA_ORIGINS "*"` needed)
 *   • vault API CORS
 * The browser only ever talks to the dev server; the dev server talks to
 * 127.0.0.1:11434 / 127.0.0.1:8765 on the machine it runs on.
 *
 * Override with OLLAMA_URL / VAULT_URL env vars if needed.
 */
const OLLAMA = process.env.OLLAMA_URL || 'http://127.0.0.1:11434'
const VAULT = process.env.VAULT_URL || 'http://127.0.0.1:8765'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true, // needed for *.e2b.app sandbox previews
    proxy: {
      '/ollama': { target: OLLAMA, changeOrigin: true, rewrite: (p) => p.replace(/^\/ollama/, '') },
      '/vault': { target: VAULT, changeOrigin: true, rewrite: (p) => p.replace(/^\/vault/, '') },
    },
  },
  build: { outDir: 'dist', sourcemap: false },
})
