import { useQuery } from '@tanstack/react-query'
import type { PaginationRequest } from '@engancha/contracts'
import { SimulatedContentsApi } from '../services/simulated-contents-api'
import { simulatedContentsKeys } from '../services/simulated-contents-query-keys'

export function useSimulatedContents(
  workspaceId: string,
  params: PaginationRequest = { page: 1, limit: 50 },
) {
  return useQuery({
    queryKey: simulatedContentsKeys.list(workspaceId, params),
    queryFn: () => SimulatedContentsApi.list(params),
    enabled: Boolean(workspaceId),
  })
}
