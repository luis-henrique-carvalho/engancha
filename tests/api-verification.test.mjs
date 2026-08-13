import test from 'node:test'
import assert from 'node:assert/strict'

import { isVerificationEndpointEnabled } from '../apps/api/src/verification/verification.environment.ts'
import { enqueueVerificationJob } from '../apps/api/src/verification/verification.enqueuer.ts'

const validJob = { version: 'v1', correlationId: 'request-123', payload: {} }

test('enqueues a valid development verification job and returns safe correlation data', async () => {
  const calls = []
  const result = await enqueueVerificationJob(
    {
      add: async (...args) => {
        calls.push(args)
        return { id: 'job-42' }
      },
    },
    validJob,
  )

  assert.deepEqual(result, { jobId: 'job-42', correlationId: 'request-123' })
  assert.deepEqual(calls[0], [
    'verification',
    validJob,
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1_000 },
      removeOnComplete: { age: 3_600, count: 100 },
      removeOnFail: { age: 86_400, count: 100 },
    },
  ])
  assert.doesNotMatch(JSON.stringify(result), /secret|password|payload/)
})

test('rejects an invalid job before touching the queue', async () => {
  let calls = 0
  await assert.rejects(
    enqueueVerificationJob(
      {
        add: async () => {
          calls += 1
        },
      },
      { ...validJob, payload: { secret: 'do-not-queue' } },
    ),
    (error) => error?.getStatus?.() === 400,
  )
  assert.equal(calls, 0)
})

test('returns a structured unavailable error when Redis or BullMQ fails', async () => {
  await assert.rejects(
    enqueueVerificationJob(
      {
        add: async () => {
          throw new Error('redis://user:secret@redis.internal')
        },
      },
      validJob,
    ),
    (error) =>
      error?.getStatus?.() === 503 && error.message === 'Verification job queue unavailable',
  )
})

test('enables the endpoint only for development and test environments', () => {
  assert.equal(isVerificationEndpointEnabled('development'), true)
  assert.equal(isVerificationEndpointEnabled('test'), true)
  assert.equal(isVerificationEndpointEnabled('production'), false)
})
