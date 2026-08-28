import { InjectQueue } from '@nestjs/bullmq'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  QUEUE_NAMES,
  simulationCommentResponseSchema,
  simulationExecutionResponseSchema,
  type AutomationExecutionJob,
  type SimulationCommentRequest,
} from '@engancha/contracts'
import { Queue } from 'bullmq'
import type { AuthorizationContext } from '../../../platform/security/authorization-context'
import {
  SIMULATION_REPOSITORY,
  type SimulationRepository,
} from '../domain/ports/simulation.repository'
import { enqueueAutomationExecutionJob } from './simulation.enqueuer'

@Injectable()
export class SimulationsService {
  constructor(
    @Inject(SIMULATION_REPOSITORY) private readonly simulations: SimulationRepository,
    @InjectQueue(QUEUE_NAMES.automationExecution)
    private readonly queue: Queue<AutomationExecutionJob>,
  ) {}

  async submit(context: AuthorizationContext, input: SimulationCommentRequest) {
    const content = await this.simulations.findSimulatedContent(
      input.contentId,
      context.organizationId,
      input.provider,
    )
    if (!content) throw new NotFoundException()

    const { execution, created } = await this.simulations.createOrFind(
      context.organizationId,
      input,
    )
    if (created || !execution.enqueuedAt) {
      await enqueueAutomationExecutionJob(this.queue, {
        version: 'v1',
        correlationId: input.idempotencyKey,
        executionId: execution.id,
        organizationId: context.organizationId,
      })
      await this.simulations.markEnqueued(execution.id)
    }

    return simulationCommentResponseSchema.parse({
      executionId: execution.id,
      status: execution.status,
      simulated: true,
    })
  }

  async get(context: AuthorizationContext, id: string) {
    const execution = await this.simulations.find(id, context.organizationId)
    if (!execution) throw new NotFoundException()

    return this.present(execution as any)
  }

  private present(execution: any) {
    return simulationExecutionResponseSchema.parse({
      id: execution.id,
      status: execution.status,
      simulated: true,
      provider: execution.provider,
      contentId: execution.contentId,
      input: {
        author: execution.inputAuthor,
        text: execution.inputText,
        commentId: execution.commentId,
        submittedAt: execution.createdAt.toISOString(),
      },
      matched: execution.matched,
      automation:
        execution.automationId && execution.automationRevision
          ? {
              id: execution.automationId,
              revisionId: execution.automationRevision.id,
              version: execution.automationRevision.version,
            }
          : null,
      outputs: execution.outputs.map((output: any) => ({
        id: output.id,
        key: output.key,
        position: output.position,
        type: output.type,
        payload: output.payload,
        createdAt: output.createdAt.toISOString(),
      })),
      attempts: execution.attempts,
      error:
        execution.errorCode && execution.errorMessage
          ? { code: execution.errorCode, message: execution.errorMessage }
          : null,
      stateVersion: execution.stateVersion,
    })
  }
}
