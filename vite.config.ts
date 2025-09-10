import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    allowedHosts: ['fc6cfb0e0aa4.ngrok-free.app']
  }
})
