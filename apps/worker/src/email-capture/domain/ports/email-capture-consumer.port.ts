import type { EmailCaptureJob } from '@engancha/contracts'
import type { ProcessEmailCaptureResult } from './email-capture-repository.port'

export const EMAIL_CAPTURE_CONSUMER = Symbol('EMAIL_CAPTURE_CONSUMER')

export interface EmailCaptureConsumer {
  consume(job: EmailCaptureJob): Promise<ProcessEmailCaptureResult>
  handleJobFailure?(params: {
    job: EmailCaptureJob
    attemptsMade: number
    maxAttempts: number
    error: Error
  }): Promise<void>
}
