import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AUTOMATION_EXECUTION_REQUESTED,
} from '@engancha/contracts'
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
