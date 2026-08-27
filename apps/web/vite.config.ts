/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { playwright } from '@vitest/browser-playwright'

const sourceDir = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  plugins: [tanstackStart(), tailwindcss(), viteReact(), tsConfigPaths()],
  resolve: {
    alias: {
      '@': sourceDir,
      '#': sourceDir,
    },
  },
  server: {
    port: Number(process.env.WEB_PORT ?? 3000),
  },
  preview: {
    port: Number(process.env.WEB_PORT ?? 3000),
  },
  test: {
    silent: 'passed-only',
    unstubEnvs: true,
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      headless: true,
    },
  },
})
