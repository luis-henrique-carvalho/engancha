import { useQuery } from '@tanstack/react-query'
import { UsersApi } from '../services/users-api'
import { usersQueryKeys } from '../services/users-query-keys'

export function useUsersList(workspaceId: string, enabled: boolean) {
  return useQuery({
    queryKey: usersQueryKeys.list(workspaceId),
    queryFn: () => UsersApi.list(),
    enabled,
  })
}
