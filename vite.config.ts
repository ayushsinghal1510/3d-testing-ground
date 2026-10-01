import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

import { api } from './server/api.ts'

export default defineConfig(({ mode }) => {
  // Server-only secrets: into process.env for the API, never exposed to the client.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react(), api()],
    // Fail on a busy port instead of quietly moving to the next one.
    server: { strictPort: true },
    preview: { strictPort: true },
    resolve: {
      alias: { '#': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  }
})
