import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tanstackStart(), viteReact(), tsConfigPaths()],
  server: {
    port: Number(process.env.WEB_PORT ?? 3000),
  },
  preview: {
    port: Number(process.env.WEB_PORT ?? 3000),
  },
})
