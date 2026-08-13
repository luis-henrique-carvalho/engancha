import { BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { verificationJobOptions, verificationJobSchema } from '@engancha/contracts'
import { type VerificationQueue } from './verification.queue'

export async function enqueueVerificationJob(
  queue: VerificationQueue,
  input: unknown,
): Promise<{ jobId: string; correlationId: string }> {
  const parsed = verificationJobSchema.safeParse(input)
  if (!parsed.success) {
    throw new BadRequestException('Invalid verification job')
  }

  const job = parsed.data
  try {
    const queued = await queue.add('verification', job, verificationJobOptions)
    if (queued.id === undefined || queued.id === null) {
      throw new Error('Queue returned no job identifier')
    }

    return { jobId: String(queued.id), correlationId: job.correlationId }
  } catch {
    throw new ServiceUnavailableException('Verification job queue unavailable')
  }
}
