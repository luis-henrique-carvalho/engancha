import type { ExecutionStatus, SimulationCommentRequest } from '@engancha/contracts'

export const SIMULATION_REPOSITORY = Symbol('SIMULATION_REPOSITORY')

export type CreatedSimulationExecution = {
  id: string
  status: ExecutionStatus
  enqueuedAt: Date | null
}

export type ListSimulationExecutionsQuery = {
  automationId?: string
  cursor?: string
  limit: number
}

export type ListSimulationExecutionsResult = {
  items: unknown[]
  nextCursor: string | null
  hasMore: boolean
}

export interface SimulationRepository {
  findSimulatedContent(
    id: string,
    organizationId: string,
    provider: SimulationCommentRequest['provider'],
  ): Promise<{ id: string } | null>
  createOrFind(
    organizationId: string,
    input: SimulationCommentRequest,
  ): Promise<{ execution: CreatedSimulationExecution; created: boolean }>
  markEnqueued(id: string): Promise<void>
  find(id: string, organizationId: string): Promise<unknown | null>
  list(
    organizationId: string,
    query: ListSimulationExecutionsQuery,
  ): Promise<ListSimulationExecutionsResult>
  resetForRetry(id: string, organizationId: string): Promise<CreatedSimulationExecution | null>
}
