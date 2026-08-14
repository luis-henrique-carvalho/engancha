import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export function webCallbackUrl(path: string): string {
  const webOrigin =
    import.meta.env.VITE_WEB_ORIGIN ??
    (typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin)

  return new URL(path, webOrigin).toString()
}

export const authClient = createAuthClient({
  baseURL: apiBaseUrl,
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [organizationClient()],
})
