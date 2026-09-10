import {
  ConflictException,
  HttpException,
  HttpStatus,
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
  simulationExecutionListResponseSchema,
  simulationExecutionResponseSchema,
  type SimulationCommentRequest,
  type SimulationExecutionListQuery,
} from '@engancha/contracts'
import type { AuthorizationContext } from '../../../platform/security/authorization-context'
import { StructuredLogger } from '../../../platform/runtime/structured-logger'
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
import {
  SIMULATION_SSE_CONNECTION_TRACKER,
  type SimulationSseConnectionTracker,
  type SimulationSseLease,
} from '../domain/ports/simulation-sse-connection-tracker.port'
import { SIMULATION_RATE_LIMIT_ERROR_CODE } from '../api/http/simulation-rate-limit.guard'

@Injectable()
export class SimulationsService {
  private readonly eventsSubscriber: SimulationEventsSubscriber
  private readonly sseTracker?: SimulationSseConnectionTracker
  private readonly logger?: { event(event: string, details?: Record<string, unknown>): void }

  constructor(
    @Inject(SIMULATION_REPOSITORY) private readonly simulations: SimulationRepository,
    @Inject(AUTOMATION_EXECUTION_DISPATCHER)
    private readonly dispatcher: AutomationExecutionDispatcher,
    @Optional()
    @Inject(SIMULATION_EVENTS_SUBSCRIBER)
    eventsSubscriber?: SimulationEventsSubscriber,
    @Optional()
    @Inject(StructuredLogger)
    logger?:
      | { event(event: string, details?: Record<string, unknown>): void }
      | SimulationSseConnectionTracker,
    @Optional()
    @Inject(SIMULATION_SSE_CONNECTION_TRACKER)
    sseTracker?: SimulationSseConnectionTracker,
  ) {
    this.eventsSubscriber = eventsSubscriber ?? {
      subscribe: async () => async () => {},
    }

    if (logger && 'tryAcquire' in logger) {
      this.sseTracker = logger as SimulationSseConnectionTracker
      this.logger = undefined
    } else if (logger && 'event' in logger) {
      this.logger = logger as { event(event: string, details?: Record<string, unknown>): void }
      this.sseTracker = sseTracker
    } else {
      this.logger = undefined
      this.sseTracker = sseTracker
    }
  }

  private logEvent(event: string, details: Record<string, unknown> = {}): void {
    this.logger?.event(event, details)
  }

  async submit(context: AuthorizationContext, input: SimulationCommentRequest) {
    this.logEvent('simulation_comment_received', {
      organizationId: context.organizationId,
      contentId: input.contentId,
      provider: input.provider,
      correlationId: input.idempotencyKey,
      hasCommentId: Boolean(input.commentId),
    })

    const content = await this.simulations.findSimulatedContent(
      input.contentId,
      context.organizationId,
      input.provider,
    )
    if (!content) {
      this.logEvent('simulation_comment_rejected', {
        organizationId: context.organizationId,
        contentId: input.contentId,
        provider: input.provider,
        correlationId: input.idempotencyKey,
        reason: 'Content not found or not in simulated mode',
      })
      throw new NotFoundException()
    }

    const { execution, created } = await this.simulations.createOrFind(
      context.organizationId,
      input,
    )

    this.logEvent(created ? 'simulation_execution_created' : 'simulation_execution_reused', {
      organizationId: context.organizationId,
      executionId: execution.id,
      correlationId: input.idempotencyKey,
      status: execution.status,
    })

    if (created || !execution.enqueuedAt) {
      try {
        await this.dispatcher.dispatch({
          type: AUTOMATION_EXECUTION_REQUESTED,
          version: 'v1',
          correlationId: input.idempotencyKey,
          executionId: execution.id,
          organizationId: context.organizationId,
        })
        await this.simulations.markEnqueued(execution.id)

        this.logEvent('simulation_execution_enqueued', {
          organizationId: context.organizationId,
          executionId: execution.id,
          correlationId: input.idempotencyKey,
          jobId: execution.id,
        })
      } catch (error) {
        this.logEvent('simulation_execution_enqueue_failed', {
          organizationId: context.organizationId,
          executionId: execution.id,
          correlationId: input.idempotencyKey,
          reason: (error as Error)?.message ?? 'Dispatch failure',
        })
        throw error
      }
    }

    return simulationCommentResponseSchema.parse({
      executionId: execution.id,
      status: execution.status,
      simulated: true,
    })
  }

  async retry(context: AuthorizationContext, id: string) {
    this.logEvent('simulation_execution_retry_requested', {
      organizationId: context.organizationId,
      executionId: id,
    })

    const execution = await this.simulations.find(id, context.organizationId)
    if (!execution) {
      this.logEvent('simulation_execution_retry_rejected', {
        organizationId: context.organizationId,
        executionId: id,
        reason: 'Execution not found',
      })
      throw new NotFoundException()
    }

    if ((execution as any).status !== 'FAILED') {
      this.logEvent('simulation_execution_retry_rejected', {
        organizationId: context.organizationId,
        executionId: id,
        status: (execution as any).status,
        reason: 'Only failed executions can be retried',
      })
      throw new ConflictException({
        code: 'INVALID_EXECUTION_STATE_FOR_RETRY',
        message: 'Only failed executions can be retried',
      })
    }

    const reset = await this.simulations.resetForRetry(id, context.organizationId)
    if (!reset) {
      this.logEvent('simulation_execution_retry_rejected', {
        organizationId: context.organizationId,
        executionId: id,
        reason: 'Could not reset execution for retry',
      })
      throw new ConflictException({
        code: 'INVALID_EXECUTION_STATE_FOR_RETRY',
        message: 'Only failed executions can be retried',
      })
    }

    const correlationId = (reset as any).idempotencyKey ?? (execution as any).idempotencyKey ?? id

    await this.dispatcher.dispatch({
      type: AUTOMATION_EXECUTION_REQUESTED,
      version: 'v1',
      correlationId,
      executionId: id,
      organizationId: context.organizationId,
    })

    await this.simulations.markEnqueued(id)

    this.logEvent('simulation_execution_retry_accepted', {
      organizationId: context.organizationId,
      executionId: id,
      correlationId,
      jobId: id,
    })

    return simulationCommentResponseSchema.parse({
      executionId: id,
      status: 'PENDING',
      simulated: true,
    })
  }

  async list(context: AuthorizationContext, query: SimulationExecutionListQuery) {
    this.logEvent('simulation_executions_list_requested', {
      organizationId: context.organizationId,
      automationId: query.automationId,
      cursor: query.cursor,
      limit: query.limit,
    })

    const result = await this.simulations.list(context.organizationId, query)

    this.logEvent('simulation_executions_listed', {
      organizationId: context.organizationId,
      count: result.items.length,
      hasNextCursor: Boolean(result.nextCursor),
      hasMore: result.hasMore,
    })

    return simulationExecutionListResponseSchema.parse({
      items: result.items.map((item) => this.present(item)),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      meta: result.meta,
    })
  }

  async get(context: AuthorizationContext, id: string) {
    const execution = await this.simulations.find(id, context.organizationId)
    if (!execution) {
      this.logEvent('simulation_execution_query_not_found', {
        organizationId: context.organizationId,
        executionId: id,
      })
      throw new NotFoundException()
    }

    this.logEvent('simulation_execution_queried', {
      organizationId: context.organizationId,
      executionId: id,
      status: (execution as any).status,
      stateVersion: (execution as any).stateVersion,
    })

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
    if (!initial) {
      this.logEvent('simulation_stream_not_found', {
        organizationId: context.organizationId,
        executionId: id,
      })
      throw new NotFoundException()
    }

    let lease: SimulationSseLease = { id: 'noop', release: () => {} }
    if (this.sseTracker) {
      const acquisition = this.sseTracker.tryAcquire({
        organizationId: context.organizationId,
        membershipId: context.membershipId,
        userId: context.userId,
      })
      if (!acquisition.acquired) {
        this.logEvent('simulation_stream_connection_limit_exceeded', {
          organizationId: context.organizationId,
          membershipId: context.membershipId,
          userId: context.userId,
          executionId: id,
          reason: acquisition.reason,
        })
        throw new HttpException(
          {
            code: SIMULATION_RATE_LIMIT_ERROR_CODE,
            message: 'Too many concurrent simulation SSE connections. Please try again later.',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }
      lease = acquisition.lease
    }

    this.logEvent('simulation_stream_opened', {
      organizationId: context.organizationId,
      executionId: id,
      initialStatus: (initial as any).status,
    })

    return this.createSimulationStreamObservable(context, id, initial, lease, options)
  }

  private createSimulationStreamObservable(
    context: AuthorizationContext,
    id: string,
    initial: unknown,
    lease: SimulationSseLease,
    options?: {
      heartbeatIntervalMs?: number
      maxDurationMs?: number
    },
  ): Observable<MessageEvent> {
    const heartbeatIntervalMs = options?.heartbeatIntervalMs ?? 15_000
    const maxDurationMs = options?.maxDurationMs ?? 30_000

    return new Observable((subscriber) => {
      return this.setupSimulationSubscriber({
        subscriber,
        context,
        id,
        initial,
        lease,
        heartbeatIntervalMs,
        maxDurationMs,
      })
    })
  }

  private createStreamCleanup(params: {
    context: AuthorizationContext
    id: string
    lease: SimulationSseLease
    heartbeatTimer: NodeJS.Timeout
    state: { isClosed: boolean; maxDurationTimer?: NodeJS.Timeout }
    getUnsubscribeFn: () => (() => Promise<void>) | null
  }): () => Promise<void> {
    const { context, id, lease, heartbeatTimer, state, getUnsubscribeFn } = params

    return async () => {
      if (state.isClosed) return
      state.isClosed = true
      clearInterval(heartbeatTimer)
      if (state.maxDurationTimer) {
        clearTimeout(state.maxDurationTimer)
      }
      lease.release()

      const unsubscribeFn = getUnsubscribeFn()
      if (unsubscribeFn) {
        try {
          await unsubscribeFn()
        } catch {
          // Ignora falhas no cancelamento de inscrição
        }
      }

      this.logEvent('simulation_stream_closed', {
        organizationId: context.organizationId,
        executionId: id,
      })
    }
  }

  private setupSimulationSubscriber(params: {
    subscriber: import('rxjs').Subscriber<MessageEvent>
    context: AuthorizationContext
    id: string
    initial: unknown
    lease: SimulationSseLease
    heartbeatIntervalMs: number
    maxDurationMs: number
  }): () => void {
    const { subscriber, context, id, initial, lease, heartbeatIntervalMs, maxDurationMs } = params
    const state = {
      isClosed: false,
      maxDurationTimer: undefined as NodeJS.Timeout | undefined,
    }
    let lastEmittedVersion = (initial as any).stateVersion ?? 1
    let lastEmittedStatus = (initial as any).status
    let unsubscribeFn: (() => Promise<void>) | null = null

    const isTerminal = this.emitInitialSnapshot(context, id, initial, subscriber)
    if (isTerminal) {
      lease.release()
      subscriber.complete()
      return () => {}
    }

    const heartbeatTimer = this.startHeartbeatTimer({
      subscriber,
      context,
      id,
      heartbeatIntervalMs,
      isClosed: () => state.isClosed,
    })

    const cleanup = this.createStreamCleanup({
      context,
      id,
      lease,
      heartbeatTimer,
      state,
      getUnsubscribeFn: () => unsubscribeFn,
    })

    state.maxDurationTimer = setTimeout(async () => {
      await cleanup()
      subscriber.complete()
    }, maxDurationMs)

    let isUpdating = false
    const checkAndEmitUpdate = async () => {
      if (state.isClosed || isUpdating) return
      isUpdating = true
      try {
        const updated = await this.handleSimulationStreamUpdate({
          context,
          id,
          lastEmittedVersion,
          lastEmittedStatus,
          subscriber,
          cleanup,
        })
        if (updated) {
          lastEmittedVersion = updated.lastEmittedVersion
          lastEmittedStatus = updated.lastEmittedStatus
        }
      } finally {
        isUpdating = false
      }
    }

    this.subscribeToSimulationEvents({
      id,
      isClosed: () => state.isClosed,
      checkAndEmitUpdate,
      cleanup,
      subscriber,
      setUnsubscribeFn: (fn) => {
        unsubscribeFn = fn
      },
    })

    return () => {
      void cleanup()
    }
  }

  private subscribeToSimulationEvents(params: {
    id: string
    isClosed: () => boolean
    checkAndEmitUpdate: () => Promise<void>
    cleanup: () => Promise<void>
    subscriber: import('rxjs').Subscriber<MessageEvent>
    setUnsubscribeFn: (fn: () => Promise<void>) => void
  }): void {
    const { id, isClosed, checkAndEmitUpdate, cleanup, subscriber, setUnsubscribeFn } = params

    this.eventsSubscriber
      .subscribe(id, async () => {
        await checkAndEmitUpdate()
      })
      .then(async (unsub) => {
        if (isClosed()) {
          void unsub()
        } else {
          setUnsubscribeFn(unsub)
          await checkAndEmitUpdate()
        }
      })
      .catch((error) => {
        if (!isClosed()) {
          void cleanup()
          subscriber.error(error)
        }
      })
  }

  private emitInitialSnapshot(
    context: AuthorizationContext,
    id: string,
    initial: unknown,
    subscriber: import('rxjs').Subscriber<MessageEvent>,
  ): boolean {
    const lastEmittedVersion = (initial as any).stateVersion ?? 1
    const lastEmittedStatus = (initial as any).status

    subscriber.next({
      type: 'snapshot',
      id: String(lastEmittedVersion),
      data: this.present(initial as any),
    })

    this.logEvent('simulation_stream_snapshot_emitted', {
      organizationId: context.organizationId,
      executionId: id,
      stateVersion: lastEmittedVersion,
      status: lastEmittedStatus,
    })

    if (['COMPLETED', 'IGNORED', 'FAILED'].includes(lastEmittedStatus)) {
      this.logEvent('simulation_stream_completed', {
        organizationId: context.organizationId,
        executionId: id,
        terminalStatus: lastEmittedStatus,
      })
      subscriber.complete()
      return true
    }

    return false
  }

  private startHeartbeatTimer(params: {
    subscriber: import('rxjs').Subscriber<MessageEvent>
    context: AuthorizationContext
    id: string
    heartbeatIntervalMs: number
    isClosed: () => boolean
  }): NodeJS.Timeout {
    const { subscriber, context, id, heartbeatIntervalMs, isClosed } = params
    return setInterval(() => {
      if (isClosed()) return
      subscriber.next({
        type: 'heartbeat',
        data: { heartbeat: true, timestamp: new Date().toISOString() },
      })
      this.logEvent('simulation_stream_heartbeat_emitted', {
        organizationId: context.organizationId,
        executionId: id,
      })
    }, heartbeatIntervalMs)
  }

  private async handleSimulationStreamUpdate(params: {
    context: AuthorizationContext
    id: string
    lastEmittedVersion: number
    lastEmittedStatus: string
    subscriber: import('rxjs').Subscriber<MessageEvent>
    cleanup: () => Promise<void>
  }): Promise<{ lastEmittedVersion: number; lastEmittedStatus: string } | null> {
    const { context, id, subscriber, cleanup } = params
    let { lastEmittedVersion, lastEmittedStatus } = params

    try {
      const current = await this.simulations.find(id, context.organizationId)
      if (!current) {
        await cleanup()
        subscriber.complete()
        return null
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

        this.logEvent('simulation_stream_update_emitted', {
          organizationId: context.organizationId,
          executionId: id,
          stateVersion,
          status,
        })

        if (['COMPLETED', 'IGNORED', 'FAILED'].includes(status)) {
          this.logEvent('simulation_stream_completed', {
            organizationId: context.organizationId,
            executionId: id,
            terminalStatus: status,
          })
          await cleanup()
          subscriber.complete()
        }

        return { lastEmittedVersion, lastEmittedStatus }
      }
    } catch {
      // Mantém o stream ativo diante de falhas de leitura transitórias
    }

    return null
  }

  private present(execution: any) {
    return simulationExecutionResponseSchema.parse({
      id: execution.id,
      status: execution.status,
      simulated: true,
      provider: execution.provider,
      contentId: execution.contentId,
      originAutomationId: execution.originAutomationId ?? null,
      content: execution.content
        ? {
            id: execution.content.id,
            title: execution.content.title,
            contentType: execution.content.contentType,
            externalContentId: execution.content.externalContentId,
          }
        : null,
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
              name: execution.automationRevision.name ?? null,
            }
          : null,
      outputs: (execution.outputs ?? []).map((output: any) => ({
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
      createdAt: execution.createdAt?.toISOString?.() ?? new Date().toISOString(),
    })
  }
}
