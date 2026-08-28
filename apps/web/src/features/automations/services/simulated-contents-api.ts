import {
  type ContentListResponse,
  type ContentResponse,
  type CreateContentRequest,
  type PaginationRequest,
  contentListResponseSchema,
  contentResponseSchema,
} from '@engancha/contracts'
import { apiFetch } from '@/lib/api-client'

export const SimulatedContentsApi = {
  async list(params: PaginationRequest = { page: 1, limit: 50 }): Promise<ContentListResponse> {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', String(params.page))
    if (params.limit) searchParams.set('limit', String(params.limit))

    const query = searchParams.toString()
    const path = query ? `/simulated-contents?${query}` : '/simulated-contents'
    const data = await apiFetch<unknown>(path)
    return contentListResponseSchema.parse(data)
  },

  async create(body: CreateContentRequest): Promise<ContentResponse> {
    const data = await apiFetch<unknown>('/simulated-contents', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return contentResponseSchema.parse(data)
  },
}
