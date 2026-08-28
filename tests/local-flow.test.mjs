import test from 'node:test'
import assert from 'node:assert/strict'

import { enqueueVerificationJob } from '../apps/api/src/modules/verification/application/verification.enqueuer.ts'
import { processVerificationJob } from '../apps/worker/src/verification/verification.job.ts'

test('routes a verification request from the API boundary to the worker boundary', async () => {
  const queued = []
  const events = []
  const request = { version: 'v1', correlationId: 'local-flow-123', payload: {} }

  const response = await enqueueVerificationJob(
    {
      add: async (name, data) => {
        queued.push({ name, data })
        return { id: 'job-local-1' }
      },
    },
    request,
  )

  const result = await processVerificationJob(
    {
      id: response.jobId,
      data: queued[0].data,
      attemptsMade: 0,
      opts: { attempts: 3 },
    },
    { event: (event, details) => events.push({ event, ...details }) },
    async (job) => ({ status: 'processed', correlationId: job.correlationId }),
  )

  assert.deepEqual(queued, [{ name: 'verification', data: request }])
  assert.deepEqual(response, { jobId: 'job-local-1', correlationId: 'local-flow-123' })
  assert.deepEqual(result, { status: 'processed', correlationId: 'local-flow-123' })
  assert.deepEqual(events, [
    { event: 'job_received', jobId: 'job-local-1', correlationId: 'local-flow-123' },
    { event: 'job_processing', jobId: 'job-local-1', correlationId: 'local-flow-123' },
  ])
})
