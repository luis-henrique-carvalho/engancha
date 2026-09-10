import type { EmailCaptureJob } from '@engancha/contracts'

export const EMAIL_CAPTURE_DISPATCHER = Symbol('EMAIL_CAPTURE_DISPATCHER')

export interface EmailCaptureDispatcher {
  dispatch(job: EmailCaptureJob): Promise<void>
}
