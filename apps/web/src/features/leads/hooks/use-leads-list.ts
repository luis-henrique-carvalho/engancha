import { useQuery } from '@tanstack/react-query'
import type { LeadListQuery } from '@engancha/contracts'
import { LeadsApi, leadsQueryKeys } from '../services/leads-api'

export function useLeadsList(query?: Partial<LeadListQuery>) {
  return useQuery({
    queryKey: leadsQueryKeys.list(query),
    queryFn: () => LeadsApi.list(query),
  })
}
