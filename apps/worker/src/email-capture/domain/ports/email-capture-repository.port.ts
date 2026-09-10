import type { EmailCaptureJob } from '@engancha/contracts'

export const EMAIL_CAPTURE_REPOSITORY = Symbol('EMAIL_CAPTURE_REPOSITORY')

export interface ProcessEmailCaptureResult {
  captureId: string
  conversationId: string
  contactId: string
  leadId?: string
  status: 'COMPLETED' | 'SUPERSEDED' | 'FAILED'
  errorCode?: string
  errorMessage?: string
}

export interface EmailCaptureRepository {
  claimAndProcess(job: EmailCaptureJob): Promise<ProcessEmailCaptureResult>
  markFailed(params: {
    captureRequestId: string
    organizationId: string
    errorCode: string
    errorMessage: string
  }): Promise<void>
}
