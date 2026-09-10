import { Inject, Injectable } from '@nestjs/common'
import type { EmailCaptureJob } from '@engancha/contracts'
import {
  EMAIL_CAPTURE_REPOSITORY,
  type EmailCaptureRepository,
  type ProcessEmailCaptureResult,
} from '../domain/ports/email-capture-repository.port'
import type { EmailCaptureConsumer } from '../domain/ports/email-capture-consumer.port'

@Injectable()
export class EmailCaptureService implements EmailCaptureConsumer {
  constructor(
    @Inject(EMAIL_CAPTURE_REPOSITORY)
    private readonly repository: EmailCaptureRepository,
  ) {}

  async consume(job: EmailCaptureJob): Promise<ProcessEmailCaptureResult> {
    return await this.repository.claimAndProcess(job)
  }

  async handleJobFailure(params: {
    job: EmailCaptureJob
    attemptsMade: number
    maxAttempts: number
    error: Error
  }): Promise<void> {
    if (params.attemptsMade >= params.maxAttempts) {
      await this.repository.markFailed({
        captureRequestId: params.job.captureRequestId,
        organizationId: params.job.organizationId,
        errorCode: 'PROCESSING_FAILED',
        errorMessage: 'A captura de e-mail falhou após múltiplas tentativas de processamento.',
      })
    }
  }
}
