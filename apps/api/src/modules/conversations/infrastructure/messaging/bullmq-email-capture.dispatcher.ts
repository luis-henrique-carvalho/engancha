import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { Queue } from 'bullmq'
import {
  EMAIL_CAPTURE_JOB,
  QUEUE_NAMES,
  emailCaptureJobOptions,
  emailCaptureJobSchema,
  type EmailCaptureJob,
} from '@engancha/contracts'
import type { EmailCaptureDispatcher } from '../../domain/ports/email-capture-dispatcher.port'

@Injectable()
export class BullMqEmailCaptureDispatcher implements EmailCaptureDispatcher {
  constructor(
    @InjectQueue(QUEUE_NAMES.emailCapture)
    private readonly queue: Queue<EmailCaptureJob>,
  ) {}

  async dispatch(job: EmailCaptureJob): Promise<void> {
    const parsed = emailCaptureJobSchema.safeParse(job)
    if (!parsed.success) {
      throw new ServiceUnavailableException('Email capture dispatch unavailable')
    }

    try {
      await this.queue.add(EMAIL_CAPTURE_JOB, parsed.data, {
        ...emailCaptureJobOptions,
        jobId: `email-capture:${parsed.data.captureRequestId}`,
      })
    } catch {
      throw new ServiceUnavailableException('Email capture dispatch unavailable')
    }
  }
}
