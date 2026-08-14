import { useQuery } from '@tanstack/react-query'
import { UsersApi } from '../services/users-api'
import { usersQueryKeys } from '../services/users-query-keys'
import type { WorkspaceMembersListRequest } from '@engancha/contracts'

export function useUsersList(
  workspaceId: string,
  params: WorkspaceMembersListRequest,
  enabled: boolean,
) {
  return useQuery({
    queryKey: usersQueryKeys.list(workspaceId, params),
    queryFn: () => UsersApi.list(params),
    enabled,
  })
}
