import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const sharedProxy = {
  '/api': {
    target: 'http://127.0.0.1:5000',
    changeOrigin: true,
  },
  '/static': {
    target: 'http://127.0.0.1:5000',
    changeOrigin: true,
  },
}

const allowedHosts = ['asng-lintas.tangerangkab.my.id', '.tangerangkab.my.id']

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5001,
    strictPort: true,
    allowedHosts,
    proxy: sharedProxy,
  },
  preview: {
    host: true,
    port: 5001,
    strictPort: true,
    allowedHosts,
    proxy: sharedProxy,
  },
})
