import {
  type SimulationCommentRequest,
  type SimulationCommentResponse,
  type SimulationExecutionResponse,
  simulationCommentResponseSchema,
  simulationExecutionResponseSchema,
} from '@engancha/contracts'
import { apiFetch } from '@/lib/api-client'
import { apiBaseUrl } from '@/lib/auth-client'

export const SimulationsApi = {
  async submitComment(body: SimulationCommentRequest): Promise<SimulationCommentResponse> {
    const data = await apiFetch<unknown>('/simulations/comments', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return simulationCommentResponseSchema.parse(data)
  },

  async getExecution(executionId: string): Promise<SimulationExecutionResponse> {
    const data = await apiFetch<unknown>(`/simulations/executions/${executionId}`)
    return simulationExecutionResponseSchema.parse(data)
  },

  async retryExecution(executionId: string): Promise<SimulationCommentResponse> {
    const data = await apiFetch<unknown>(`/simulations/executions/${executionId}/retry`, {
      method: 'POST',
    })
    return simulationCommentResponseSchema.parse(data)
  },

  getEventsUrl(executionId: string): string {
    return `${apiBaseUrl}/api/v1/simulations/executions/${executionId}/events`
  },
}
