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

test('registra eventos estruturados de retry e falha definitiva', () => {
  const events = []
  const processor = new BullMqAutomationExecutionProcessor(
    { event: (event, details) => events.push({ event, ...details }) },
    { consume: async () => ({ executionId: '', status: '' }) },
  )

  processor.onFailed(validJob, new Error('Redis network blip'))
  processor.onFailed({ ...validJob, attemptsMade: 4 }, new Error('Fatal error'))

  assert.deepEqual(
    events.map(({ event }) => event),
    ['automation_execution_job_retry', 'automation_execution_job_failed_definitive'],
  )
  assert.equal(events[0].attemptsMade, 1)
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

test('vincula automação e persiste snapshot sanitizado no match único', async () => {
  let savedSnapshotParams = null
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
    saveMatchSnapshot: async (params) => {
      savedSnapshotParams = params
    },
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
    status: 'PROCESSING',
    matched: true,
    automationId: 'auto-1',
    revisionId: 'rev-1',
  })
  assert.deepEqual(savedSnapshotParams, {
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
  })
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
  })
})
