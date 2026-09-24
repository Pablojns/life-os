import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { stripeLocalPlugin } from './scripts/vite-stripe-local.js'
import { aiCoachLocalPlugin } from './scripts/vite-ai-coach-local.js'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), stripeLocalPlugin(), aiCoachLocalPlugin()],
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-XSS-Protection': '1; mode=block',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
})
