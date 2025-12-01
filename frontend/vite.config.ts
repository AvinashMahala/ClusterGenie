import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    // Use environment variable for port, default to 5173
    port: process.env.FRONTEND_PORT ? parseInt(process.env.FRONTEND_PORT) : 5173,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
    },
  },
})
