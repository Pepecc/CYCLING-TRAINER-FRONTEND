import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import EnvironmentPlugin from 'vite-plugin-environment'
import dotenv from 'dotenv'

export default defineConfig({
 plugins: [react(), EnvironmentPlugin('all', { prefix: 'VITE_' })],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
