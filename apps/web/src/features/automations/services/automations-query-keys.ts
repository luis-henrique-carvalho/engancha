import type { AutomationListRequest } from '@engancha/contracts'

export const automationsKeys = {
  all: ['automations'] as const,
  workspace: (workspaceId: string) => ['workspaces', workspaceId, 'automations'] as const,
  lists: (workspaceId: string) => ['workspaces', workspaceId, 'automations', 'list'] as const,
  list: (workspaceId: string, params: AutomationListRequest) =>
    ['workspaces', workspaceId, 'automations', 'list', params] as const,
  details: (workspaceId: string) => ['workspaces', workspaceId, 'automations', 'detail'] as const,
  detail: (workspaceId: string, automationId: string) =>
    ['workspaces', workspaceId, 'automations', 'detail', automationId] as const,
}
