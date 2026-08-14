import type { QueryClient } from '@tanstack/react-query'
import { usersQueryKeys } from './users-query-keys'

export const usersInvalidations = {
  invalidateList(queryClient: QueryClient) {
    void queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() })
  },
}
