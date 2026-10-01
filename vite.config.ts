import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

import { api } from './server/api.ts'

export default defineConfig(({ mode }) => {
  // Server-only secrets: into process.env for the API, never exposed to the client.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  /* Vite refuses requests whose Host header it does not know. The production
     domain is listed here; add more in ALLOWED_HOSTS (comma-separated) in .env. */
  const allowedHosts = [
    'kp.proroleplay.com',
    ...(process.env.ALLOWED_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean),
  ]

  return {
    plugins: [react(), api()],
    // Fail on a busy port instead of quietly moving to the next one.
    server: { strictPort: true, allowedHosts },
    preview: { strictPort: true, allowedHosts },
    resolve: {
      alias: { '#': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  }
})
