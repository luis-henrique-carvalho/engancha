import type { QueryClient } from '@tanstack/react-query'
import { automationsKeys } from './automations-query-keys'

export function invalidateAutomationsList(
  queryClient: QueryClient,
  workspaceId: string,
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: automationsKeys.lists(workspaceId),
  })
}

export function invalidateAutomationDetail(
  queryClient: QueryClient,
  workspaceId: string,
  automationId: string,
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: automationsKeys.detail(workspaceId, automationId),
  })
}
