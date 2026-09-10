import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Injectable } from '@nestjs/common'
import { Job, UnrecoverableError } from 'bullmq'
import { QUEUE_NAMES, emailCaptureJobSchema } from '@engancha/contracts'
import { WORKER_LOGGER } from '../../../common/worker-logger.token'
import type { EventLogger } from '../../../common/runtime-lifecycle.service'
import {
  EMAIL_CAPTURE_CONSUMER,
  type EmailCaptureConsumer,
} from '../../domain/ports/email-capture-consumer.port'
import type { ProcessEmailCaptureResult } from '../../domain/ports/email-capture-repository.port'

@Injectable()
@Processor(QUEUE_NAMES.emailCapture, { concurrency: 2 })
export class BullMqEmailCaptureProcessor extends WorkerHost {
  constructor(
    @Inject(WORKER_LOGGER) private readonly logger: EventLogger,
    @Inject(EMAIL_CAPTURE_CONSUMER)
    private readonly consumer: EmailCaptureConsumer,
  ) {
    super()
  }

  async process(job: Job<unknown>): Promise<ProcessEmailCaptureResult> {
    const parsed = emailCaptureJobSchema.safeParse(job.data)
    const correlationId =
      parsed.success && parsed.data.correlationId ? parsed.data.correlationId : 'unknown'
    const captureRequestId =
      parsed.success && parsed.data.captureRequestId ? parsed.data.captureRequestId : 'unknown'

    this.logger.event('email_capture_job_received', {
      jobId: String(job.id),
      correlationId,
      captureRequestId,
    })

    if (!parsed.success) {
      this.logger.event('email_capture_job_rejected', {
        jobId: String(job.id),
        correlationId,
        reason: 'Invalid schema payload',
      })
      throw new UnrecoverableError('Invalid email capture job payload')
    }

    const result = await this.consumer.consume(parsed.data)

    if (result.status === 'FAILED' && result.errorCode === 'IDENTITY_CONFLICT') {
      // Conflito de negócio: não entra em loop de retry
      this.logger.event('email_capture_job_identity_conflict', {
        jobId: String(job.id),
        correlationId,
        captureRequestId,
        errorCode: result.errorCode,
      })
      return result
    }

    this.logger.event('email_capture_job_completed', {
      jobId: String(job.id),
      correlationId,
      captureRequestId: result.captureId,
      status: result.status,
    })

    return result
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<unknown> | undefined, error: Error): Promise<void> {
    const attemptsMade = job?.attemptsMade ?? 0
    const attempts = job?.opts.attempts ?? 1
    const parsed = emailCaptureJobSchema.safeParse(job?.data)
    const correlationId =
      parsed.success && parsed.data.correlationId ? parsed.data.correlationId : 'unknown'
    const captureRequestId =
      parsed.success && parsed.data.captureRequestId ? parsed.data.captureRequestId : 'unknown'

    this.logger.event(
      attemptsMade < attempts ? 'email_capture_job_retry' : 'email_capture_job_failed_definitive',
      {
        jobId: job ? String(job.id) : 'unknown',
        correlationId,
        captureRequestId,
        attemptsMade,
        attempts,
        reason: error.name || error.message,
      },
    )

    if (parsed.success && this.consumer.handleJobFailure) {
      try {
        await this.consumer.handleJobFailure({
          job: parsed.data,
          attemptsMade,
          maxAttempts: attempts,
          error,
        })
      } catch (handlingError) {
        this.logger.event('email_capture_job_failure_handler_error', {
          jobId: job ? String(job.id) : 'unknown',
          correlationId,
          captureRequestId,
          reason: (handlingError as Error)?.message ?? 'Unknown error',
        })
      }
    }
  }
}
