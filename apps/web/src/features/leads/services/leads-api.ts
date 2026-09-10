import {
  type LeadListQuery,
  type LeadListResponse,
  leadListResponseSchema,
} from '@engancha/contracts'
import { apiFetch } from '@/lib/api-client'

export const leadsQueryKeys = {
  all: ['leads'] as const,
  list: (params?: Partial<LeadListQuery>) => [...leadsQueryKeys.all, 'list', params] as const,
}

export const LeadsApi = {
  async list(query?: Partial<LeadListQuery>): Promise<LeadListResponse> {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined && value !== '')
        .flatMap(([key, value]) =>
          Array.isArray(value) ? value.map((item) => [key, String(item)]) : [[key, String(value)]],
        ),
    )

    const queryString = params.toString()
    const path = queryString ? `/leads?${queryString}` : '/leads'

    const data = await apiFetch<unknown>(path)
    return leadListResponseSchema.parse(data)
  },
}
