import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/bf-identity': {
        target: 'https://identitysso.betfair.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/bf-identity/, ''),
      },
      '/bf-api': {
        target: 'https://api.betfair.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/bf-api/, ''),
      },
    },
  },
})
