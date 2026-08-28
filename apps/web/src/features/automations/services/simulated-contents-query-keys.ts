import type { PaginationRequest } from '@engancha/contracts'

export const simulatedContentsKeys = {
  all: ['simulated-contents'] as const,
  workspace: (workspaceId: string) => ['workspaces', workspaceId, 'simulated-contents'] as const,
  list: (workspaceId: string, params?: PaginationRequest) =>
    ['workspaces', workspaceId, 'simulated-contents', params ?? {}] as const,
}
