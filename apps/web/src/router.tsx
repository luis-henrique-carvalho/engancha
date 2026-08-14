import { createRouter } from '@tanstack/react-router'
import '@tanstack/react-start'
import { routeTree } from './routeTree.gen'
import { createQueryClient } from './lib/query-client'

export function getRouter() {
  const { queryClient, setOnUnauthorized } = createQueryClient()

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    scrollRestoration: true,
  })

  setOnUnauthorized(() => {
    void router.navigate({ to: '/auth/login', replace: true })
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}

declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
  }
}
