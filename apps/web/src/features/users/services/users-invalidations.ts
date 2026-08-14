import type { QueryClient } from '@tanstack/react-query'
import { usersQueryKeys } from './users-query-keys'

export const usersInvalidations = {
  invalidateList(queryClient: QueryClient, workspaceId: string) {
    void queryClient.invalidateQueries({ queryKey: usersQueryKeys.list(workspaceId) })
  },
}
