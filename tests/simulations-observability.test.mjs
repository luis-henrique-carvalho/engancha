import assert from 'node:assert/strict'
import test from 'node:test'
import { AUTOMATION_EXECUTION_REQUESTED, SIMULATION_UPDATED_EVENT } from '@engancha/contracts'
import { SimulationsService } from '../apps/api/src/modules/simulations/application/simulations.service.ts'
import { AutomationExecutionService } from '../apps/worker/src/automation-execution/application/automation-execution.service.ts'

const context = {
  userId: 'user-obs-1',
  organizationId: 'org-obs-1',
  membershipId: 'membership-obs-1',
  role: 'member',
}

const commentInput = {
  contentId: 'content-obs-1',
  provider: 'INSTAGRAM',
  author: 'SeguidorSensivel',
  text: 'Comentario super sensivel com palavra chave material',
  commentId: 'comment-ext-123',
  idempotencyKey: 'idem-key-obs-001',
}

test('SimulationsService registra eventos estruturados e correlacionados na ingestao e enfileiramento sem vazar PII', async () => {
  const loggedEvents = []
  const mockLogger = {
    event: (event, details) => loggedEvents.push({ event, ...details }),
  }

  const mockRepository = {
    findSimulatedContent: async () => ({ id: 'content-obs-1' }),
    createOrFind: async () => ({
      execution: {
        id: 'exec-obs-1',
        status: 'PENDING',
        enqueuedAt: null,
      },
      created: true,
    }),
    markEnqueued: async () => {},
    find: async () => null,
  }

  const mockDispatcher = {
    dispatch: async () => {},
  }

  const service = new SimulationsService(mockRepository, mockDispatcher, undefined, mockLogger)

  await service.submit(context, commentInput)

  const eventNames = loggedEvents.map((e) => e.event)
  assert.ok(eventNames.includes('simulation_comment_received'))
  assert.ok(eventNames.includes('simulation_execution_created'))
  assert.ok(eventNames.includes('simulation_execution_enqueued'))

  const receivedEvent = loggedEvents.find((e) => e.event === 'simulation_comment_received')
  assert.equal(receivedEvent.organizationId, 'org-obs-1')
  assert.equal(receivedEvent.contentId, 'content-obs-1')
  assert.equal(receivedEvent.provider, 'INSTAGRAM')
  assert.equal(receivedEvent.correlationId, 'idem-key-obs-001')
  assert.equal(receivedEvent.hasCommentId, true)

  const stringified = JSON.stringify(loggedEvents)
  assert.doesNotMatch(stringified, /SeguidorSensivel/i)
  assert.doesNotMatch(stringified, /Comentario super sensivel/i)
})

test('SimulationsService registra evento ao reutilizar execucao idempotente', async () => {
  const loggedEvents = []
  const mockLogger = {
    event: (event, details) => loggedEvents.push({ event, ...details }),
  }

  const mockRepository = {
    findSimulatedContent: async () => ({ id: 'content-obs-1' }),
    createOrFind: async () => ({
      execution: {
        id: 'exec-obs-reused',
        status: 'PENDING',
        enqueuedAt: new Date(),
      },
      created: false,
    }),
    markEnqueued: async () => {},
    find: async () => null,
  }

  const service = new SimulationsService(
    mockRepository,
    { dispatch: async () => {} },
    undefined,
    mockLogger,
  )

  await service.submit(context, commentInput)

  const reusedEvent = loggedEvents.find((e) => e.event === 'simulation_execution_reused')
  assert.ok(reusedEvent)
  assert.equal(reusedEvent.executionId, 'exec-obs-reused')
  assert.equal(reusedEvent.correlationId, 'idem-key-obs-001')
})

test('SimulationsService registra eventos no ciclo de retry', async () => {
  const loggedEvents = []
  const mockLogger = {
    event: (event, details) => loggedEvents.push({ event, ...details }),
  }

  const mockRepository = {
    find: async (id, organizationId) => ({
      id,
      organizationId,
      status: 'FAILED',
      idempotencyKey: 'idem-failed',
    }),
    resetForRetry: async (id) => ({
      id,
      status: 'PENDING',
      enqueuedAt: null,
      idempotencyKey: 'idem-failed',
    }),
    markEnqueued: async () => {},
  }

  const service = new SimulationsService(
    mockRepository,
    { dispatch: async () => {} },
    undefined,
    mockLogger,
  )

  await service.retry(context, 'exec-failed-1')

  const eventNames = loggedEvents.map((e) => e.event)
  assert.ok(eventNames.includes('simulation_execution_retry_requested'))
  assert.ok(eventNames.includes('simulation_execution_retry_accepted'))

  const accepted = loggedEvents.find((e) => e.event === 'simulation_execution_retry_accepted')
  assert.equal(accepted.executionId, 'exec-failed-1')
  assert.equal(accepted.jobId, 'exec-failed-1')
})

test('SimulationsService registra eventos estruturados no stream SSE', async () => {
  const loggedEvents = []
  const mockLogger = {
    event: (event, details) => loggedEvents.push({ event, ...details }),
  }

  let subscriberCb = null
  const mockSubscriber = {
    subscribe: async (executionId, onEvent) => {
      subscriberCb = onEvent
      return async () => {}
    },
  }

  let dbStatus = 'PENDING'
  let dbVersion = 1
  const mockRepository = {
    find: async (id, organizationId) => ({
      id,
      organizationId,
      status: dbStatus,
      provider: 'INSTAGRAM',
      contentId: 'content-1',
      inputAuthor: 'Author',
      inputText: 'Text',
      commentId: null,
      createdAt: new Date(),
      matched: dbStatus === 'COMPLETED',
      automationId: dbStatus === 'COMPLETED' ? 'auto-1' : null,
      automationRevision: dbStatus === 'COMPLETED' ? { id: 'rev-1', version: 1 } : null,
      outputs: [],
      attempts: 1,
      errorCode: null,
      errorMessage: null,
      stateVersion: dbVersion,
    }),
  }

  const service = new SimulationsService(
    mockRepository,
    { dispatch: async () => {} },
    mockSubscriber,
    mockLogger,
  )

  const observable = await service.stream(context, 'exec-stream-1', {
    heartbeatIntervalMs: 10_000,
    maxDurationMs: 5_000,
  })

  observable.subscribe({ next: () => {} })

  dbStatus = 'COMPLETED'
  dbVersion = 2
  await subscriberCb({
    type: SIMULATION_UPDATED_EVENT,
    version: 'v1',
    executionId: 'exec-stream-1',
    organizationId: 'org-obs-1',
    stateVersion: 2,
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
  })

  const eventNames = loggedEvents.map((e) => e.event)
  assert.ok(eventNames.includes('simulation_stream_opened'))
  assert.ok(eventNames.includes('simulation_stream_snapshot_emitted'))
  assert.ok(eventNames.includes('simulation_stream_update_emitted'))
  assert.ok(eventNames.includes('simulation_stream_completed'))
})

test('AutomationExecutionService registra eventos estruturados de matching, outputs e conclusao', async () => {
  const loggedEvents = []
  const mockLogger = {
    event: (event, details) => loggedEvents.push({ event, ...details }),
  }

  const repository = {
    claimExecution: async (executionId, organizationId) => ({
      id: executionId,
      organizationId,
      contentId: 'content-1',
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      inputText: 'Quero o material agora!',
      inputAuthor: 'Follower',
      commentId: null,
      originAutomationId: null,
      status: 'PROCESSING',
      attempts: 1,
      stateVersion: 2,
    }),
    findActiveCandidateAutomations: async () => [
      {
        id: 'auto-obs-1',
        organizationId: 'org-obs-1',
        status: 'ACTIVE',
        currentPublishedRevision: {
          id: 'rev-obs-1',
          version: 1,
          target: { id: 'target-1', contentId: 'content-1' },
          trigger: {
            id: 'trig-1',
            type: 'COMMENT_KEYWORD',
            keyword: 'Material',
            keywordNormalized: 'material',
          },
          actions: [
            {
              id: 'act-1',
              position: 0,
              type: 'PUBLIC_REPLY',
              config: { text: 'Resposta Secreta' },
            },
          ],
        },
      },
    ],
    saveExecutionCompleted: async () => {},
    markIgnored: async () => {},
    markFailed: async () => {},
  }

  const service = new AutomationExecutionService(repository, undefined, mockLogger)
  await service.consume({
    type: AUTOMATION_EXECUTION_REQUESTED,
    version: 'v1',
    correlationId: 'cor-123',
    executionId: 'exec-obs-worker',
    organizationId: 'org-obs-1',
  })

  const eventNames = loggedEvents.map((e) => e.event)
  assert.ok(eventNames.includes('automation_execution_claimed'))
  assert.ok(eventNames.includes('automation_execution_matching_started'))
  assert.ok(eventNames.includes('automation_execution_matched'))
  assert.ok(eventNames.includes('automation_execution_outputs_generated'))
  assert.ok(eventNames.includes('automation_execution_completed'))

  const stringified = JSON.stringify(loggedEvents)
  assert.doesNotMatch(stringified, /Resposta Secreta/i)
  assert.doesNotMatch(stringified, /Quero o material agora/i)
})

test('AutomationExecutionService registra eventos em resultado IGNORED e falha terminal', async () => {
  const loggedEvents = []
  const mockLogger = {
    event: (event, details) => loggedEvents.push({ event, ...details }),
  }

  const repository = {
    claimExecution: async (executionId, organizationId) => ({
      id: executionId,
      organizationId,
      contentId: 'content-1',
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      inputText: 'Outro comentario sem match',
      inputAuthor: 'Follower',
      commentId: null,
      originAutomationId: null,
      status: 'PROCESSING',
      attempts: 1,
      stateVersion: 2,
    }),
    findActiveCandidateAutomations: async () => [],
    markIgnored: async () => {},
    markFailed: async () => {},
    recordAttemptFailure: async () => {},
  }

  const service = new AutomationExecutionService(repository, undefined, mockLogger)
  await service.consume({
    type: AUTOMATION_EXECUTION_REQUESTED,
    version: 'v1',
    correlationId: 'cor-123',
    executionId: 'exec-ignored',
    organizationId: 'org-obs-1',
  })

  assert.ok(loggedEvents.some((e) => e.event === 'automation_execution_ignored'))

  await service.handleJobFailure({
    executionId: 'exec-failed',
    organizationId: 'org-obs-1',
    attemptsMade: 4,
    maxAttempts: 4,
    error: new Error('Simulated network error'),
  })

  const terminalFailed = loggedEvents.find(
    (e) => e.event === 'automation_execution_failed_terminal',
  )
  assert.ok(terminalFailed)
  assert.equal(terminalFailed.errorCode, 'EXECUTION_FAILED')
})
