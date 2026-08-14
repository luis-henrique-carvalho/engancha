import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Job } from 'bullmq'
import { queueNames } from '@engancha/contracts'
import { StructuredLogger } from '../common/structured-logger'
import {
  logVerificationFailure,
  logVerificationSuccess,
  processVerificationJob,
  type VerificationExecutor,
  type VerificationResult,
} from './verification.job'

@Injectable()
@Processor(queueNames.verification, { concurrency: 1 })
export class VerificationProcessor extends WorkerHost {
  execute: VerificationExecutor = async (job) => ({
    status: 'processed',
    correlationId: job.correlationId,
  })

  constructor(private readonly logger: StructuredLogger) {
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
