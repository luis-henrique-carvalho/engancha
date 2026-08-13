import test from 'node:test'
import assert from 'node:assert/strict'

import {
  contractsVersion,
  queueNames,
  verificationJobOptions,
  verificationJobSchema,
} from '@engancha/contracts'

const validVerificationJob = {
  version: contractsVersion,
  correlationId: 'request-123',
  payload: {},
}

test('accepts a versioned verification job with its minimum payload', () => {
  const result = verificationJobSchema.safeParse(validVerificationJob)

  assert.equal(result.success, true)
  if (result.success) assert.deepEqual(result.data, validVerificationJob)
})

test('rejects invalid verification jobs deterministically', () => {
  const invalidJobs = [
    { ...validVerificationJob, version: 'v2' },
    { ...validVerificationJob, correlationId: '' },
    { ...validVerificationJob, payload: { organizationId: 'org-1' } },
    { ...validVerificationJob, unexpected: true },
  ]

  for (const job of invalidJobs) {
    const result = verificationJobSchema.safeParse(job)
    assert.equal(result.success, false)
  }
})

test('exports the version and central queue registry', () => {
  assert.equal(contractsVersion, 'v1')
  assert.deepEqual(queueNames, {
    verification: 'verification',
    emailDelivery: 'email-delivery',
    automationExecution: 'automation-execution',
    messageDelivery: 'message-delivery',
    analytics: 'analytics',
  })
  assert.equal(new Set(Object.values(queueNames)).size, Object.values(queueNames).length)
})

test('exposes conservative retry, backoff, and retention options', () => {
  assert.deepEqual(verificationJobOptions, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1_000 },
    removeOnComplete: { age: 3_600, count: 100 },
    removeOnFail: { age: 86_400, count: 100 },
  })
})
