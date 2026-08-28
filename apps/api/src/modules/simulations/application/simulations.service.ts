import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  type MessageEvent,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import {
  AUTOMATION_EXECUTION_REQUESTED,
  simulationCommentResponseSchema,
  simulationExecutionResponseSchema,
  type SimulationCommentRequest,
} from '@engancha/contracts'
import type { AuthorizationContext } from '../../../platform/security/authorization-context'
import {
  SIMULATION_REPOSITORY,
  type SimulationRepository,
} from '../domain/ports/simulation.repository'
import {
  AUTOMATION_EXECUTION_DISPATCHER,
  type AutomationExecutionDispatcher,
} from '../domain/ports/automation-execution-dispatcher.port'
import {
  SIMULATION_EVENTS_SUBSCRIBER,
  type SimulationEventsSubscriber,
} from '../domain/ports/simulation-events-subscriber.port'

@Injectable()
export class SimulationsService {
  private readonly eventsSubscriber: SimulationEventsSubscriber

  constructor(
    @Inject(SIMULATION_REPOSITORY) private readonly simulations: SimulationRepository,
    @Inject(AUTOMATION_EXECUTION_DISPATCHER)
    private readonly dispatcher: AutomationExecutionDispatcher,
    @Optional()
    @Inject(SIMULATION_EVENTS_SUBSCRIBER)
    eventsSubscriber?: SimulationEventsSubscriber,
  ) {
    this.eventsSubscriber = eventsSubscriber ?? {
      subscribe: async () => async () => {},
    }
  }

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
      await this.dispatcher.dispatch({
        type: AUTOMATION_EXECUTION_REQUESTED,
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

  async retry(context: AuthorizationContext, id: string) {
    const execution = await this.simulations.find(id, context.organizationId)
    if (!execution) throw new NotFoundException()

    if ((execution as any).status !== 'FAILED') {
      throw new ConflictException({
        code: 'INVALID_EXECUTION_STATE_FOR_RETRY',
        message: 'Only failed executions can be retried',
      })
    }

    const reset = await this.simulations.resetForRetry(id, context.organizationId)
    if (!reset) {
      throw new ConflictException({
        code: 'INVALID_EXECUTION_STATE_FOR_RETRY',
        message: 'Only failed executions can be retried',
      })
    }

    await this.dispatcher.dispatch({
      type: AUTOMATION_EXECUTION_REQUESTED,
      version: 'v1',
      correlationId: (reset as any).idempotencyKey ?? (execution as any).idempotencyKey ?? id,
      executionId: id,
      organizationId: context.organizationId,
    })

    await this.simulations.markEnqueued(id)

    return simulationCommentResponseSchema.parse({
      executionId: id,
      status: 'PENDING',
      simulated: true,
    })
  }

  async get(context: AuthorizationContext, id: string) {
    const execution = await this.simulations.find(id, context.organizationId)
    if (!execution) throw new NotFoundException()

    return this.present(execution as any)
  }

  async stream(
    context: AuthorizationContext,
    id: string,
    options?: {
      heartbeatIntervalMs?: number
      maxDurationMs?: number
    },
  ): Promise<Observable<MessageEvent>> {
    const initial = await this.simulations.find(id, context.organizationId)
    if (!initial) throw new NotFoundException()

    const heartbeatIntervalMs = options?.heartbeatIntervalMs ?? 15_000
    const maxDurationMs = options?.maxDurationMs ?? 30_000

    return new Observable((subscriber) => {
      let isClosed = false
      let lastEmittedVersion = (initial as any).stateVersion ?? 1
      let lastEmittedStatus = (initial as any).status
      let unsubscribeFn: (() => Promise<void>) | null = null

      subscriber.next({
        type: 'snapshot',
        id: String(lastEmittedVersion),
        data: this.present(initial as any),
      })

      if (['COMPLETED', 'IGNORED', 'FAILED'].includes(lastEmittedStatus)) {
        subscriber.complete()
        return
      }

      const heartbeatTimer = setInterval(() => {
        if (isClosed) return
        subscriber.next({
          type: 'heartbeat',
          data: { heartbeat: true, timestamp: new Date().toISOString() },
        })
      }, heartbeatIntervalMs)

      const cleanup = async () => {
        if (isClosed) return
        isClosed = true
        clearInterval(heartbeatTimer)
        clearTimeout(maxDurationTimer)
        if (unsubscribeFn) {
          try {
            await unsubscribeFn()
          } catch {
            // Ignora falhas no cancelamento de inscrição
          }
        }
      }

      const maxDurationTimer = setTimeout(async () => {
        await cleanup()
        subscriber.complete()
      }, maxDurationMs)

      const checkAndEmitUpdate = async () => {
        if (isClosed) return
        try {
          const current = await this.simulations.find(id, context.organizationId)
          if (!current) {
            await cleanup()
            subscriber.complete()
            return
          }

          const stateVersion = (current as any).stateVersion ?? 1
          const status = (current as any).status

          if (stateVersion > lastEmittedVersion || status !== lastEmittedStatus) {
            lastEmittedVersion = stateVersion
            lastEmittedStatus = status

            subscriber.next({
              type: 'update',
              id: String(stateVersion),
              data: this.present(current as any),
            })

            if (['COMPLETED', 'IGNORED', 'FAILED'].includes(status)) {
              await cleanup()
              subscriber.complete()
            }
          }
        } catch {
          // Mantém o stream ativo diante de falhas de leitura transitórias
        }
      }

      this.eventsSubscriber
        .subscribe(id, async () => {
          await checkAndEmitUpdate()
        })
        .then(async (unsub) => {
          if (isClosed) {
            void unsub()
          } else {
            unsubscribeFn = unsub
            await checkAndEmitUpdate()
          }
        })
        .catch((error) => {
          if (!isClosed) {
            void cleanup()
            subscriber.error(error)
          }
        })

      return () => {
        void cleanup()
      }
    })
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
