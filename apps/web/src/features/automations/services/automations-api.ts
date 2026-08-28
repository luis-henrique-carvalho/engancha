import {
  type AutomationListRequest,
  type AutomationListResponse,
  type AutomationResponse,
  type CreateAutomationRequest,
  type PatchAutomationRequest,
  automationListResponseSchema,
  automationResponseSchema,
} from '@engancha/contracts'
import { apiFetch } from '@/lib/api-client'

export const AutomationsApi = {
  async list(
    params: AutomationListRequest = { page: 1, limit: 20 },
  ): Promise<AutomationListResponse> {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .flatMap(([key, value]) =>
          Array.isArray(value)
            ? value.map((item) => [key, String(item)])
            : [[key, String(value)]],
        ),
    )

    const path = `/automations?${query}`
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
