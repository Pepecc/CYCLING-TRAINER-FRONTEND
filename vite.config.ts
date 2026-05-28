import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import EnvironmentPlugin from 'vite-plugin-environment'
import dotenv from 'dotenv'
dotenv.config({})

export default defineConfig(({mode}: any) => {
  const env = loadEnv(mode, process.cwd());
  return {
  plugins: [react(), EnvironmentPlugin('all', { prefix: 'REACT_APP_' })],
    server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  }

})
