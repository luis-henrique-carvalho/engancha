import test from 'node:test'
import assert from 'node:assert/strict'
import {
  logVerificationFailure,
  logVerificationSuccess,
  processVerificationJob,
} from '../apps/worker/src/verification/verification.job.ts'

const validJob = {
  id: 'job-42',
  data: { version: 'v1', correlationId: 'request-123', payload: {} },
  attemptsMade: 1,
  opts: { attempts: 3 },
}

test('processes a valid verification job through the shared contract', async () => {
  const entries = []
  let executions = 0
  const result = await processVerificationJob(
    validJob,
    { event: (event, details) => entries.push({ event, ...details }) },
    async (job) => {
      executions += 1
      return { status: 'processed', correlationId: job.correlationId }
    },
  )

  assert.deepEqual(result, { status: 'processed', correlationId: 'request-123' })
  assert.equal(executions, 1)
  assert.deepEqual(
    entries.map(({ event }) => event),
    ['job_received', 'job_processing'],
  )
  assert.equal(entries[0].correlationId, 'request-123')
})

test('rejects an invalid payload without invoking the executor', async () => {
  const entries = []
  let executions = 0
  await assert.rejects(
    processVerificationJob(
      { ...validJob, data: { ...validJob.data, payload: { secret: 'never-process' } } },
      { event: (event, details) => entries.push({ event, ...details }) },
      async () => {
        executions += 1
        return { status: 'processed', correlationId: 'unexpected' }
      },
    ),
    (error) =>
      error?.name === 'UnrecoverableError' && error.message === 'Invalid verification job payload',
  )
  assert.equal(executions, 0)
  assert.deepEqual(
    entries.map(({ event }) => event),
    ['job_received', 'job_rejected'],
  )
  assert.equal(entries[1].correlationId, 'request-123')
})

test('logs retry and definitive failure with job correlation', () => {
  const entries = []
  const logger = { event: (event, details) => entries.push({ event, ...details }) }

  logVerificationFailure(validJob, new Error('temporary failure'), logger)
  logVerificationFailure({ ...validJob, attemptsMade: 3 }, new Error('permanent failure'), logger)

  assert.deepEqual(
    entries.map(({ event }) => event),
    ['job_retry', 'job_failed_definitive'],
  )
  assert.equal(entries[0].correlationId, 'request-123')
  assert.equal(entries[1].attemptsMade, 3)
})

test('logs successful completion with job correlation', () => {
  const entries = []
  logVerificationSuccess(validJob, {
    event: (event, details) => entries.push({ event, ...details }),
  })

  assert.deepEqual(entries, [
    {
      event: 'job_succeeded',
      jobId: 'job-42',
      correlationId: 'request-123',
    },
  ])
})
