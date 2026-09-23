import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { stripeLocalPlugin } from './scripts/vite-stripe-local.js'
import { aiCoachLocalPlugin } from './scripts/vite-ai-coach-local.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), stripeLocalPlugin(), aiCoachLocalPlugin()],
})
