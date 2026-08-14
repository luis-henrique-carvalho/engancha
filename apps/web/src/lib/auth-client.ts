import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const authClient = createAuthClient({
  baseURL: apiBaseUrl,
  plugins: [organizationClient()],
})
