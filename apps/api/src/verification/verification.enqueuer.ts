import { BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { Queue } from 'bullmq'
import { QUEUE_NAMES, verificationJobSchema, type VerificationJob } from '@engancha/contracts'

export async function enqueueVerificationJob(
  queue: Pick<Queue<VerificationJob>, 'add'>,
  input: unknown,
): Promise<{ jobId: string; correlationId: string }> {
  const parsed = verificationJobSchema.safeParse(input)
  if (!parsed.success) {
    throw new BadRequestException('Invalid verification job')
  }

  const job = parsed.data
  try {
    const queued = await queue.add(QUEUE_NAMES.VERIFICATION, job)
    if (queued.id === undefined || queued.id === null) {
      throw new Error('Queue returned no job identifier')
    }

    return { jobId: String(queued.id), correlationId: job.correlationId }
  } catch {
    throw new ServiceUnavailableException('Verification job queue unavailable')
  }
}
