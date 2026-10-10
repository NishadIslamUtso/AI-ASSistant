import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    // Allow the sandbox preview domain (*.e2b.app) only. Local Windows use is unaffected.
    allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'],
  },
})
