import { useQuery } from '@tanstack/react-query'
import { UsersApi } from '../services/users-api'
import { usersQueryKeys } from '../services/users-query-keys'
import type { ListUsersRequest } from '../contracts'

export function useUsersList(params: ListUsersRequest) {
  return useQuery({
    queryKey: usersQueryKeys.list(params),
    queryFn: () => UsersApi.list(params),
  })
}
