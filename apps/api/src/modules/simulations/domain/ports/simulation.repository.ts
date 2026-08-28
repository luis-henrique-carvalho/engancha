import type { ExecutionStatus, SimulationCommentRequest } from '@engancha/contracts'

export const SIMULATION_REPOSITORY = Symbol('SIMULATION_REPOSITORY')

export type CreatedSimulationExecution = {
  id: string
  status: ExecutionStatus
  enqueuedAt: Date | null
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
  resetForRetry(id: string, organizationId: string): Promise<CreatedSimulationExecution | null>
}

