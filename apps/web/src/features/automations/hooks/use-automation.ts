import { useQuery } from '@tanstack/react-query'
import { AutomationsApi } from '../services/automations-api'
import { automationsKeys } from '../services/automations-query-keys'

export function useAutomation(workspaceId: string, automationId: string) {
  return useQuery({
    queryKey: automationsKeys.detail(workspaceId, automationId),
    queryFn: () => AutomationsApi.getById(automationId),
    enabled: Boolean(workspaceId && automationId),
  })
}
