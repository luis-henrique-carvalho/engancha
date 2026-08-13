import { Inject, Injectable } from '@nestjs/common'
import { VERIFICATION_QUEUE, type VerificationQueue } from './verification.queue'
import { enqueueVerificationJob } from './verification.enqueuer'

@Injectable()
export class VerificationService {
  constructor(@Inject(VERIFICATION_QUEUE) private readonly queue: VerificationQueue) {}

  enqueue(input: unknown): Promise<{ jobId: string; correlationId: string }> {
    return enqueueVerificationJob(this.queue, input)
  }
}
