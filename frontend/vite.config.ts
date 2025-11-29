import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    // Use Vite's default (5173) to avoid conflicts with Grafana (3001) and local ports.
    port: 5173,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
    },
  },
})
