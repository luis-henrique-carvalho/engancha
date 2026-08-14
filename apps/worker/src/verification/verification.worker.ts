import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Injectable } from '@nestjs/common'
import { Job } from 'bullmq'
import { queueNames } from '@engancha/contracts'
import { WORKER_LOGGER } from '../common/worker-logger.token'
import type { EventLogger } from '../common/runtime-lifecycle.service'
import {
  logVerificationFailure,
  logVerificationSuccess,
  processVerificationJob,
  VERIFICATION_EXECUTOR,
  type VerificationExecutor,
  type VerificationResult,
} from './verification.job'

@Injectable()
@Processor(queueNames.verification, { concurrency: 1 })
export class VerificationProcessor extends WorkerHost {
  constructor(
    @Inject(WORKER_LOGGER) private readonly logger: EventLogger,
    @Inject(VERIFICATION_EXECUTOR) private readonly execute: VerificationExecutor,
  ) {
    super()
  }

  process(job: Job<unknown>): Promise<VerificationResult> {
    return processVerificationJob(job, this.logger, this.execute)
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<unknown>): void {
    logVerificationSuccess(job, this.logger)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<unknown> | undefined, error: Error): void {
    logVerificationFailure(job, error, this.logger)
  }

  @OnWorkerEvent('error')
  onWorkerError(error: Error): void {
    this.logger.event('worker_error', { reason: error.message })
  }
}
