import assert from 'node:assert/strict'
import test from 'node:test'
import { AUTOMATION_EXECUTION_REQUESTED } from '@engancha/contracts'
import { BullMqAutomationExecutionProcessor } from '../apps/worker/src/automation-execution/infrastructure/messaging/bullmq-automation-execution.processor.ts'

const validJob = {
  id: 'job-100',
  data: {
    type: AUTOMATION_EXECUTION_REQUESTED,
    version: 'v1',
    correlationId: 'simulation-001',
    executionId: 'execution-100',
    organizationId: 'org-100',
  },
  attemptsMade: 1,
  opts: { attempts: 4 },
}

test('processa job de execução válido através da porta AutomationExecutionConsumer', async () => {
  const events = []
  let consumedMessage = null

  const processor = new BullMqAutomationExecutionProcessor(
    { event: (event, details) => events.push({ event, ...details }) },
    {
      consume: async (message) => {
        consumedMessage = message
        return { executionId: message.executionId, status: 'HANDLED' }
      },
    },
  )

  const result = await processor.process(validJob)

  assert.deepEqual(result, { executionId: 'execution-100', status: 'HANDLED' })
  assert.deepEqual(consumedMessage, validJob.data)
  assert.deepEqual(
    events.map(({ event }) => event),
    ['automation_execution_job_received', 'automation_execution_job_completed'],
  )
  assert.equal(events[0].correlationId, 'simulation-001')
  assert.equal(events[1].status, 'HANDLED')
})

test('rejeita job com payload inválido com UnrecoverableError sem acionar o consumidor', async () => {
  const events = []
  let consumed = false

  const processor = new BullMqAutomationExecutionProcessor(
    { event: (event, details) => events.push({ event, ...details }) },
    {
      consume: async () => {
        consumed = true
        return { executionId: 'unknown', status: 'HANDLED' }
      },
    },
  )

  await assert.rejects(
    processor.process({
      ...validJob,
      data: { ...validJob.data, type: 'invalid.type' },
    }),
    (error) =>
      error?.name === 'UnrecoverableError' &&
      error.message === 'Invalid automation execution job payload',
  )

  assert.equal(consumed, false)
  assert.deepEqual(
    events.map(({ event }) => event),
    ['automation_execution_job_received', 'automation_execution_job_rejected'],
  )
})

test('registra eventos estruturados de retry e aciona handleJobFailure', async () => {
  const events = []
  let failureHandled = null
  const processor = new BullMqAutomationExecutionProcessor(
    { event: (event, details) => events.push({ event, ...details }) },
    {
      consume: async () => ({ executionId: '', status: '' }),
      handleJobFailure: async (params) => {
        failureHandled = params
      },
    },
  )

  await processor.onFailed(validJob, new Error('Redis network blip'))
  assert.deepEqual(
    events.map(({ event }) => event),
    ['automation_execution_job_retry'],
  )
  assert.equal(events[0].attemptsMade, 1)
  assert.deepEqual(failureHandled, {
    executionId: 'execution-100',
    organizationId: 'org-100',
    attemptsMade: 1,
    maxAttempts: 4,
    error: failureHandled.error,
  })

  await processor.onFailed({ ...validJob, attemptsMade: 4 }, new Error('Fatal error'))
  assert.equal(events[1].event, 'automation_execution_job_failed_definitive')
  assert.equal(events[1].attemptsMade, 4)
})

import { AutomationExecutionService } from '../apps/worker/src/automation-execution/application/automation-execution.service.ts'

test('ignora execução quando claim não é obtido (já em processamento ou terminal)', async () => {
  let findCalled = false
  const repository = {
    claimExecution: async () => null,
    findActiveCandidateAutomations: async () => {
      findCalled = true
      return []
    },
    saveMatchSnapshot: async () => {},
    markIgnored: async () => {},
    markFailed: async () => {},
  }

  const service = new AutomationExecutionService(repository)
  const result = await service.consume(validJob.data)

  assert.deepEqual(result, { executionId: 'execution-100', status: 'SKIPPED' })
  assert.equal(findCalled, false)
})

test('marca como IGNORED com matched=false quando nenhuma automação ativa corresponde ao comentário', async () => {
  let ignoredParams = null
  const repository = {
    claimExecution: async (executionId, organizationId) => ({
      id: executionId,
      organizationId,
      contentId: 'content-1',
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      inputText: 'Gostei muito da foto!',
      inputAuthor: 'Maria',
      commentId: null,
      originAutomationId: 'origin-auto-99',
      status: 'PROCESSING',
      attempts: 1,
      stateVersion: 2,
    }),
    findActiveCandidateAutomations: async () => [
      {
        id: 'auto-1',
        organizationId: 'org-100',
        status: 'ACTIVE',
        currentPublishedRevision: {
          id: 'rev-1',
          version: 1,
          target: { id: 'target-1', contentId: 'content-1' },
          trigger: {
            id: 'trig-1',
            type: 'COMMENT_KEYWORD',
            keyword: 'Material',
            keywordNormalized: 'material',
          },
          actions: [{ id: 'act-1', position: 0, type: 'PUBLIC_REPLY', config: { text: 'Olá!' } }],
        },
      },
    ],
    saveMatchSnapshot: async () => {
      throw new Error('Should not save snapshot')
    },
    markIgnored: async (params) => {
      ignoredParams = params
    },
    markFailed: async () => {
      throw new Error('Should not fail')
    },
  }

  const service = new AutomationExecutionService(repository)
  const result = await service.consume(validJob.data)

  assert.deepEqual(result, { executionId: 'execution-100', status: 'IGNORED', matched: false })
  assert.deepEqual(ignoredParams, {
    executionId: 'execution-100',
    organizationId: 'org-100',
    reason: 'Nenhuma automação ativa corresponde ao comentário',
  })
})

test('vincula automação, valida capacidades e persiste snapshot e saídas no match único', async () => {
  let savedCompletedParams = null
  const repository = {
    claimExecution: async (executionId, organizationId) => ({
      id: executionId,
      organizationId,
      contentId: 'content-1',
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      inputText: 'Olá, eu quero o material por favor!',
      inputAuthor: 'Carlos',
      commentId: 'comment-123',
      originAutomationId: null,
      status: 'PROCESSING',
      attempts: 1,
      stateVersion: 2,
    }),
    findActiveCandidateAutomations: async () => [
      {
        id: 'auto-1',
        organizationId: 'org-100',
        status: 'ACTIVE',
        currentPublishedRevision: {
          id: 'rev-1',
          version: 2,
          target: { id: 'target-1', contentId: 'content-1' },
          trigger: {
            id: 'trig-1',
            type: 'COMMENT_KEYWORD',
            keyword: 'Material',
            keywordNormalized: 'material',
          },
          actions: [
            { id: 'act-1', position: 0, type: 'PUBLIC_REPLY', config: { text: 'Enviando!' } },
            {
              id: 'act-2',
              position: 1,
              type: 'LINK',
              config: { url: 'https://example.com', label: 'Link' },
            },
          ],
        },
      },
    ],
    saveExecutionCompleted: async (params) => {
      savedCompletedParams = params
    },
    saveMatchSnapshot: async () => {},
    markIgnored: async () => {
      throw new Error('Should not be ignored')
    },
    markFailed: async () => {
      throw new Error('Should not fail')
    },
  }

  const service = new AutomationExecutionService(repository)
  const result = await service.consume(validJob.data)

  assert.deepEqual(result, {
    executionId: 'execution-100',
    status: 'COMPLETED',
    matched: true,
    automationId: 'auto-1',
    revisionId: 'rev-1',
  })
  assert.deepEqual(savedCompletedParams, {
    executionId: 'execution-100',
    organizationId: 'org-100',
    automationId: 'auto-1',
    revisionId: 'rev-1',
    snapshot: {
      automationId: 'auto-1',
      revisionId: 'rev-1',
      version: 2,
      target: { contentId: 'content-1' },
      trigger: {
        type: 'COMMENT_KEYWORD',
        keyword: 'Material',
        keywordNormalized: 'material',
      },
      actions: [
        { position: 0, type: 'PUBLIC_REPLY', config: { text: 'Enviando!' } },
        { position: 1, type: 'LINK', config: { url: 'https://example.com', label: 'Link' } },
      ],
    },
    outputs: [
      {
        key: 'execution-100:0:PUBLIC_REPLY',
        position: 0,
        type: 'PUBLIC_REPLY',
        payload: { text: 'Enviando!', simulated: true },
      },
      {
        key: 'execution-100:1:LINK_DELIVERY',
        position: 1,
        type: 'LINK_DELIVERY',
        payload: { url: 'https://example.com', label: 'Link', simulated: true },
      },
    ],
  })
})

test('falha com UNSUPPORTED_CHANNEL_ACTION quando canal não suporta ação configurada', async () => {
  let failedParams = null
  const repository = {
    claimExecution: async (executionId, organizationId) => ({
      id: executionId,
      organizationId,
      contentId: 'content-1',
      provider: 'TIKTOK',
      mode: 'REAL',
      inputText: 'Quero o material',
      inputAuthor: 'Carlos',
      commentId: null,
      originAutomationId: null,
      status: 'PROCESSING',
      attempts: 1,
      stateVersion: 2,
    }),
    findActiveCandidateAutomations: async () => [
      {
        id: 'auto-1',
        organizationId: 'org-100',
        status: 'ACTIVE',
        currentPublishedRevision: {
          id: 'rev-1',
          version: 1,
          target: { id: 'target-1', contentId: 'content-1' },
          trigger: {
            id: 'trig-1',
            type: 'COMMENT_KEYWORD',
            keyword: 'Material',
            keywordNormalized: 'material',
          },
          actions: [{ id: 'act-1', position: 0, type: 'PUBLIC_REPLY', config: { text: 'Olá!' } }],
        },
      },
    ],
    saveExecutionCompleted: async () => {},
    markIgnored: async () => {},
    markFailed: async (params) => {
      failedParams = params
    },
  }

  const service = new AutomationExecutionService(repository)
  const result = await service.consume(validJob.data)

  assert.deepEqual(result, {
    executionId: 'execution-100',
    status: 'FAILED',
    matched: true,
    errorCode: 'UNSUPPORTED_CHANNEL_ACTION',
  })
  assert.equal(failedParams.errorCode, 'UNSUPPORTED_CHANNEL_ACTION')
})

test('falha fechado com AMBIGUOUS_AUTOMATION_MATCH se múltiplos matches forem encontrados', async () => {
  let failedParams = null
  const repository = {
    claimExecution: async (executionId, organizationId) => ({
      id: executionId,
      organizationId,
      contentId: 'content-1',
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      inputText: 'Quero material e ebook',
      inputAuthor: 'Lucas',
      commentId: null,
      originAutomationId: null,
      status: 'PROCESSING',
      attempts: 1,
      stateVersion: 2,
    }),
    findActiveCandidateAutomations: async () => [
      {
        id: 'auto-1',
        organizationId: 'org-100',
        status: 'ACTIVE',
        currentPublishedRevision: {
          id: 'rev-1',
          version: 1,
          target: { id: 'target-1', contentId: 'content-1' },
          trigger: {
            id: 'trig-1',
            type: 'COMMENT_KEYWORD',
            keyword: 'Material',
            keywordNormalized: 'material',
          },
          actions: [],
        },
      },
      {
        id: 'auto-2',
        organizationId: 'org-100',
        status: 'ACTIVE',
        currentPublishedRevision: {
          id: 'rev-2',
          version: 1,
          target: { id: 'target-2', contentId: 'content-1' },
          trigger: {
            id: 'trig-2',
            type: 'COMMENT_KEYWORD',
            keyword: 'Ebook',
            keywordNormalized: 'ebook',
          },
          actions: [],
        },
      },
    ],
    saveMatchSnapshot: async () => {
      throw new Error('Should not save snapshot on ambiguous match')
    },
    markIgnored: async () => {
      throw new Error('Should not ignore on ambiguous match')
    },
    markFailed: async (params) => {
      failedParams = params
    },
  }

  const service = new AutomationExecutionService(repository)
  const result = await service.consume(validJob.data)

  assert.deepEqual(result, {
    executionId: 'execution-100',
    status: 'FAILED',
    matched: false,
    errorCode: 'AMBIGUOUS_AUTOMATION_MATCH',
  })
  assert.deepEqual(failedParams, {
    executionId: 'execution-100',
    organizationId: 'org-100',
    errorCode: 'AMBIGUOUS_AUTOMATION_MATCH',
    errorMessage: 'Múltiplas automações ativas correspondem ao comentário',
    matched: false,
  })
})

test('handleJobFailure grava tentativa quando tentativas não foram esgotadas', async () => {
  let attemptFailureParams = null
  const repository = {
    recordAttemptFailure: async (params) => {
      attemptFailureParams = params
    },
    markFailed: async () => {
      throw new Error('Should not mark failed')
    },
  }

  const service = new AutomationExecutionService(repository)
  await service.handleJobFailure({
    executionId: 'exec-1',
    organizationId: 'org-1',
    attemptsMade: 2,
    maxAttempts: 4,
    error: new Error('Network timeout'),
  })

  assert.deepEqual(attemptFailureParams, {
    executionId: 'exec-1',
    organizationId: 'org-1',
    attemptsMade: 2,
  })
})

test('handleJobFailure marca como FAILED com erro sanitizado quando tentativas são esgotadas', async () => {
  let failedParams = null
  const repository = {
    recordAttemptFailure: async () => {
      throw new Error('Should not record attempt')
    },
    markFailed: async (params) => {
      failedParams = params
    },
  }

  const service = new AutomationExecutionService(repository)
  await service.handleJobFailure({
    executionId: 'exec-1',
    organizationId: 'org-1',
    attemptsMade: 4,
    maxAttempts: 4,
    error: new Error('Critical connection failure'),
  })

  assert.deepEqual(failedParams, {
    executionId: 'exec-1',
    organizationId: 'org-1',
    errorCode: 'EXECUTION_FAILED',
    errorMessage: 'Falha ao processar execução',
  })
})

test('reprocessamento reutiliza snapshot e automação existentes sem consultar candidatos novamente', async () => {
  let findCandidatesCalled = false
  let completedParams = null
  const existingSnapshot = {
    automationId: 'auto-reused',
    revisionId: 'rev-reused',
    version: 1,
    target: { contentId: 'content-1' },
    trigger: {
      type: 'COMMENT_KEYWORD',
      keyword: 'Material',
      keywordNormalized: 'material',
    },
    actions: [
      { position: 0, type: 'PUBLIC_REPLY', config: { text: 'Resposta reutilizada' } },
      { position: 1, type: 'LINK', config: { url: 'https://reused.test', label: 'Abrir' } },
    ],
  }

  const repository = {
    claimExecution: async (executionId, organizationId) => ({
      id: executionId,
      organizationId,
      contentId: 'content-1',
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      inputText: 'Quero o material',
      inputAuthor: 'Lucas',
      commentId: null,
      originAutomationId: null,
      automationId: 'auto-reused',
      automationRevisionId: 'rev-reused',
      automationSnapshot: existingSnapshot,
      status: 'PROCESSING',
      attempts: 2,
      stateVersion: 3,
    }),
    findActiveCandidateAutomations: async () => {
      findCandidatesCalled = true
      return []
    },
    saveExecutionCompleted: async (params) => {
      completedParams = params
    },
    markIgnored: async () => {},
    markFailed: async () => {},
  }

  const service = new AutomationExecutionService(repository)
  const result = await service.consume(validJob.data)

  assert.equal(findCandidatesCalled, false)
  assert.equal(result.status, 'COMPLETED')
  assert.equal(result.automationId, 'auto-reused')
  assert.equal(result.revisionId, 'rev-reused')
  assert.equal(completedParams.outputs.length, 2)
  assert.equal(completedParams.outputs[0].key, 'execution-100:0:PUBLIC_REPLY')
  assert.equal(completedParams.outputs[1].key, 'execution-100:1:LINK_DELIVERY')
})

test('publica evento na porta SimulationEventsPublisher ao concluir execução', async () => {
  const publishedEvents = []
  const publisher = {
    publish: async (event) => {
      publishedEvents.push(event)
    },
  }

  const repository = {
    claimExecution: async (executionId, organizationId) => ({
      id: executionId,
      organizationId,
      contentId: 'content-1',
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      inputText: 'Material',
      inputAuthor: 'Lucas',
      commentId: null,
      originAutomationId: null,
      status: 'PROCESSING',
      attempts: 1,
      stateVersion: 1,
    }),
    findActiveCandidateAutomations: async () => [
      {
        id: 'auto-1',
        organizationId: 'org-100',
        status: 'ACTIVE',
        currentPublishedRevision: {
          id: 'rev-1',
          version: 1,
          target: { id: 'target-1', contentId: 'content-1' },
          trigger: {
            id: 'trig-1',
            type: 'COMMENT_KEYWORD',
            keyword: 'Material',
            keywordNormalized: 'material',
          },
          actions: [{ id: 'act-1', position: 0, type: 'PUBLIC_REPLY', config: { text: 'Olá!' } }],
        },
      },
    ],
    saveExecutionCompleted: async () => {},
    markIgnored: async () => {},
    markFailed: async () => {},
  }

  const service = new AutomationExecutionService(repository, publisher)
  await service.consume(validJob.data)

  assert.equal(publishedEvents.length, 1)
  assert.equal(publishedEvents[0].executionId, 'execution-100')
  assert.equal(publishedEvents[0].status, 'COMPLETED')
  assert.equal(publishedEvents[0].stateVersion, 3)
})
