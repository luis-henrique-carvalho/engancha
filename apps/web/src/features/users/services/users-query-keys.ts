export const usersQueryKeys = {
  all: ['users'] as const,
  lists: () => [...usersQueryKeys.all, 'list'] as const,
  list: (workspaceId: string) => [...usersQueryKeys.lists(), workspaceId] as const,
}
