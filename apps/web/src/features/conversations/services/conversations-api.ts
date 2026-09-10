import {
  type ConversationDetailResponse,
  type ConversationListQuery,
  type ConversationListResponse,
  conversationDetailResponseSchema,
  conversationListResponseSchema,
} from '@engancha/contracts'
import { apiFetch } from '@/lib/api-client'

export const conversationsQueryKeys = {
  all: ['conversations'] as const,
  list: (params?: Partial<ConversationListQuery>) =>
    [...conversationsQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...conversationsQueryKeys.all, 'detail', id] as const,
}

export const ConversationsApi = {
  async list(query?: Partial<ConversationListQuery>): Promise<ConversationListResponse> {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined && value !== '')
        .flatMap(([key, value]) =>
          Array.isArray(value) ? value.map((item) => [key, String(item)]) : [[key, String(value)]],
        ),
    )

    const queryString = params.toString()
    const path = queryString ? `/conversations?${queryString}` : '/conversations'

    const data = await apiFetch<unknown>(path)
    return conversationListResponseSchema.parse(data)
  },

  async getById(id: string): Promise<ConversationDetailResponse> {
    const data = await apiFetch<unknown>(`/conversations/${id}`)
    return conversationDetailResponseSchema.parse(data)
  },
}
