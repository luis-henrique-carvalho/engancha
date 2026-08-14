import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiClientError } from './api-client'
import { handleServerError } from './handle-server-error'

export function createQueryClient() {
  let isHandlingUnauthorized = false
  let onUnauthorized: (() => void) | undefined

  function handleError(error: unknown) {
    handleServerError(error)

    if (
      typeof window !== 'undefined' &&
      error instanceof ApiClientError &&
      error.status === 401 &&
      !isHandlingUnauthorized
    ) {
      isHandlingUnauthorized = true
      onUnauthorized?.()
    }
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: import.meta.env.PROD,
        retry: (failureCount) => failureCount < (import.meta.env.PROD ? 3 : 0),
        staleTime: 10_000,
      },
    },
    queryCache: new QueryCache({
      onError: handleError,
    }),
    mutationCache: new MutationCache({
      onError: handleError,
    }),
  })

  return {
    queryClient,
    setOnUnauthorized(handler: () => void) {
      onUnauthorized = handler
    },
  }
}
