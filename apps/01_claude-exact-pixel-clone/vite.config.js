import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// allowedHosts: true lets the sandbox preview host reach the dev server.
// start-app.bat still passes --host 127.0.0.1, so local Windows runs stay localhost-only.
export default defineConfig({ plugins: [react()], server: { host: '127.0.0.1', port: 5173, allowedHosts: true } })
