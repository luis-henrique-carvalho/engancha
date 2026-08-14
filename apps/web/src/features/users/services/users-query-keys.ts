export const usersQueryKeys = {
  all: ['users'] as const,
  lists: () => [...usersQueryKeys.all, 'list'] as const,
  list: (workspaceId: string, params: object) =>
    [...usersQueryKeys.lists(), workspaceId, params] as const,
}
