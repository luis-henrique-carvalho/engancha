import {
  type AutomationListResponse,
  type AutomationResponse,
  type CreateAutomationRequest,
  type PatchAutomationRequest,
  type PaginationRequest,
  automationListResponseSchema,
  automationResponseSchema,
} from '@engancha/contracts'
import { apiFetch } from '@/lib/api-client'

export const AutomationsApi = {
  async list(params: PaginationRequest = { page: 1, limit: 20 }): Promise<AutomationListResponse> {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', String(params.page))
    if (params.limit) searchParams.set('limit', String(params.limit))

    const query = searchParams.toString()
    const path = query ? `/automations?${query}` : '/automations'
    const data = await apiFetch<unknown>(path)
    return automationListResponseSchema.parse(data)
  },

  async getById(automationId: string): Promise<AutomationResponse> {
    const data = await apiFetch<unknown>(`/automations/${automationId}`)
    return automationResponseSchema.parse(data)
  },

  async create(body: CreateAutomationRequest = {}): Promise<AutomationResponse> {
    const data = await apiFetch<unknown>('/automations', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return automationResponseSchema.parse(data)
  },

  async patch(automationId: string, body: PatchAutomationRequest): Promise<AutomationResponse> {
    const data = await apiFetch<unknown>(`/automations/${automationId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return automationResponseSchema.parse(data)
  },

  async publish(automationId: string): Promise<AutomationResponse> {
    const data = await apiFetch<unknown>(`/automations/${automationId}/publish`, {
      method: 'POST',
    })
    return automationResponseSchema.parse(data)
  },

  async pause(automationId: string): Promise<AutomationResponse> {
    const data = await apiFetch<unknown>(`/automations/${automationId}/pause`, {
      method: 'POST',
    })
    return automationResponseSchema.parse(data)
  },
}
