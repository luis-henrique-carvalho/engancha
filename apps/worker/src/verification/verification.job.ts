import { Job, UnrecoverableError } from 'bullmq'
import { verificationJobSchema, type VerificationJob } from '@engancha/contracts'
import { StructuredLogger } from '../common/structured-logger'

export type VerificationResult = { status: 'processed'; correlationId: string }
export type VerificationExecutor = (job: VerificationJob) => Promise<VerificationResult>

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
  logger: Pick<StructuredLogger, 'event'>,
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
  logger: Pick<StructuredLogger, 'event'>,
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
  logger: Pick<StructuredLogger, 'event'>,
): void {
  logger.event('job_succeeded', {
    jobId: String(job.id),
    correlationId: correlationFrom(job),
  })
}
