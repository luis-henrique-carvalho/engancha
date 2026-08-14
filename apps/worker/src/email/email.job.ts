import { Job, UnrecoverableError } from 'bullmq'
import { emailDeliveryJobSchema, type EmailDeliveryJob } from '@engancha/contracts'
import type { EventLogger } from '../common/runtime-lifecycle.service'

export type EmailDeliveryResult = { status: 'sent' | 'mocked'; type: EmailDeliveryJob['type'] }
export type EmailTransport = (job: EmailDeliveryJob) => Promise<'sent' | 'mocked'>
export const EMAIL_TRANSPORT = Symbol('EMAIL_TRANSPORT')

export async function processEmailDeliveryJob(
  job: Job<unknown>,
  logger: EventLogger,
  transport: EmailTransport,
): Promise<EmailDeliveryResult> {
  const parsed = emailDeliveryJobSchema.safeParse(job.data)
  const correlationId =
    parsed.success && parsed.data.correlationId ? parsed.data.correlationId : 'unknown'
  logger.event('email_job_received', {
    jobId: String(job.id),
    correlationId,
    type: parsed.success ? parsed.data.type : 'unknown',
  })

  if (!parsed.success) {
    logger.event('email_job_rejected', { jobId: String(job.id), correlationId })
    throw new UnrecoverableError('Invalid email delivery job payload')
  }

  const status = await transport(parsed.data)
  logger.event('email_job_sent', {
    jobId: String(job.id),
    correlationId,
    type: parsed.data.type,
    status,
  })
  return { status, type: parsed.data.type }
}

export function logEmailDeliveryFailure(
  job: Job<unknown> | undefined,
  error: Error,
  logger: EventLogger,
): void {
  const attemptsMade = job?.attemptsMade ?? 0
  const attempts = job?.opts.attempts ?? 1
  logger.event(attemptsMade < attempts ? 'email_job_retry' : 'email_job_failed_definitive', {
    jobId: job ? String(job.id) : 'unknown',
    attemptsMade,
    attempts,
    reason: error.name,
  })
}
