import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bullmq'
import { queueNames, type VerificationJob } from '@engancha/contracts'
import { enqueueVerificationJob } from './verification.enqueuer'

@Injectable()
export class VerificationService {
  constructor(
    @InjectQueue(queueNames.verification) private readonly queue: Queue<VerificationJob>,
  ) {}

  enqueue(input: unknown): Promise<{ jobId: string; correlationId: string }> {
    return enqueueVerificationJob(this.queue, input)
  }
}
