import { useQuery } from '@tanstack/react-query'
import type { AutomationListRequest } from '@engancha/contracts'
import { AutomationsApi } from '../services/automations-api'
import { automationsKeys } from '../services/automations-query-keys'

export function useAutomationsList(
  workspaceId: string,
  params: AutomationListRequest = { page: 1, limit: 20 },
) {
  return useQuery({
    queryKey: automationsKeys.list(workspaceId, params),
    queryFn: () => AutomationsApi.list(params),
    enabled: Boolean(workspaceId),
  })
}
