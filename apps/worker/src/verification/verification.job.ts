import { Job, UnrecoverableError } from 'bullmq'
import { verificationJobSchema, type VerificationJob } from '@engancha/contracts'
import type { EventLogger } from '../common/runtime-lifecycle.service'

export type VerificationResult = { status: 'processed'; correlationId: string }
export type VerificationExecutor = (job: VerificationJob) => Promise<VerificationResult>
export const VERIFICATION_EXECUTOR = Symbol('VERIFICATION_EXECUTOR')

export const verificationExecutor: VerificationExecutor = async (job) => ({
  status: 'processed',
  correlationId: job.correlationId,
})

function correlationFrom(job: Job<unknown> | undefined): string {
  const candidate = job?.data
  if (
    typeof candidate === 'object' &&
    candidate !== null &&
    'correlationId' in candidate &&
    typeof candidate.correlationId === 'string' &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(candidate.correlationId.trim())
  ) {
    return candidate.correlationId.trim()
  }

  const parsed = verificationJobSchema.safeParse(job?.data)
  return parsed.success ? parsed.data.correlationId : 'unknown'
}

export async function processVerificationJob(
  job: Job<unknown>,
  logger: EventLogger,
  execute: VerificationExecutor,
): Promise<VerificationResult> {
  const correlationId = correlationFrom(job)
  logger.event('job_received', { jobId: String(job.id), correlationId })

  const parsed = verificationJobSchema.safeParse(job.data)
  if (!parsed.success) {
    logger.event('job_rejected', {
      jobId: String(job.id),
      correlationId,
      reason: 'invalid_payload',
    })
    throw new UnrecoverableError('Invalid verification job payload')
  }

  logger.event('job_processing', { jobId: String(job.id), correlationId })
  return execute(parsed.data)
}

export function logVerificationFailure(
  job: Job<unknown> | undefined,
  error: Error,
  logger: EventLogger,
): void {
  const attemptsMade = job?.attemptsMade ?? 0
  const attempts = job?.opts.attempts ?? 1
  const details = {
    jobId: job ? String(job.id) : 'unknown',
    correlationId: correlationFrom(job),
    attemptsMade,
    attempts,
    reason: error.message,
  }

  logger.event(attemptsMade < attempts ? 'job_retry' : 'job_failed_definitive', details)
}

export function logVerificationSuccess(
  job: Job<unknown>,
  logger: EventLogger,
): void {
  logger.event('job_succeeded', {
    jobId: String(job.id),
    correlationId: correlationFrom(job),
  })
}
