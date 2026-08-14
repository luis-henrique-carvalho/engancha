import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Injectable } from '@nestjs/common'
import { Job } from 'bullmq'
import { QUEUE_NAMES } from '@engancha/contracts'
import { WORKER_LOGGER } from '../common/worker-logger.token'
import type { EventLogger } from '../common/runtime-lifecycle.service'
import {
  EMAIL_TRANSPORT,
  logEmailDeliveryFailure,
  processEmailDeliveryJob,
  type EmailDeliveryResult,
  type EmailTransport,
} from './email.job'

@Injectable()
@Processor(QUEUE_NAMES.emailDelivery, { concurrency: 2 })
export class EmailDeliveryProcessor extends WorkerHost {
  constructor(
    @Inject(WORKER_LOGGER) private readonly logger: EventLogger,
    @Inject(EMAIL_TRANSPORT) private readonly transport: EmailTransport,
  ) {
    super()
  }

  process(job: Job<unknown>): Promise<EmailDeliveryResult> {
    return processEmailDeliveryJob(job, this.logger, this.transport)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<unknown> | undefined, error: Error): void {
    logEmailDeliveryFailure(job, error, this.logger)
  }
}
