import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@lib', replacement: path.resolve(__dirname, 'src/lib') },
      { find: '@errors', replacement: path.resolve(__dirname, 'src/errors') },
      { find: '@betfair', replacement: path.resolve(__dirname, 'src/lib/betfair') },
    ],
  },
})
