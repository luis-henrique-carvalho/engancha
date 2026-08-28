import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AUTOMATION_EXECUTION_REQUESTED,
  automationExecutionRequestedSchema,
} from '@engancha/contracts'
import { BullMqAutomationExecutionDispatcher } from '../apps/api/src/modules/simulations/infrastructure/messaging/bullmq-automation-execution.dispatcher.ts'

test('publica uma solicitação versionada de execução por meio do adaptador BullMQ', async () => {
  const calls = []
  const dispatcher = new BullMqAutomationExecutionDispatcher({
    add: async (...args) => {
      calls.push(args)
      return { id: 'execution-1' }
    },
  })
  const message = {
    type: AUTOMATION_EXECUTION_REQUESTED,
    version: 'v1',
    correlationId: 'comment-001',
    executionId: 'execution-1',
    organizationId: 'organization-1',
  }

  await dispatcher.dispatch(message)

  assert.deepEqual(automationExecutionRequestedSchema.parse(message), message)
  assert.deepEqual(calls, [
    [AUTOMATION_EXECUTION_REQUESTED, message, { jobId: 'execution-1' }],
  ])
  assert.throws(() => automationExecutionRequestedSchema.parse({ ...message, untrusted: true }))
})
