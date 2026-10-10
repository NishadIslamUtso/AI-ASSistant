import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// host true = 0.0.0.0 so the Arena live preview proxy can reach it.
// allowedHosts true lets the proxied preview host through Vite's host check.
// start-app.bat on Windows passes --host 127.0.0.1 explicitly, staying local-only.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, allowedHosts: true },
})
