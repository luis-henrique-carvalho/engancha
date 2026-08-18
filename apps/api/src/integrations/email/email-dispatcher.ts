import { Queue } from 'bullmq'
import {
  emailDeliveryJobOptions,
  emailDeliveryJobSchema,
  QUEUE_NAMES,
  type EmailDeliveryJob,
} from '@engancha/contracts'

let queue: Queue<EmailDeliveryJob> | undefined

function getQueue(): Queue<EmailDeliveryJob> {
  return (queue ??= new Queue<EmailDeliveryJob>(QUEUE_NAMES.emailDelivery, {
    connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
    defaultJobOptions: emailDeliveryJobOptions,
  }))
}

export async function enqueueEmailDelivery(input: EmailDeliveryJob): Promise<void> {
  const job = emailDeliveryJobSchema.parse(input)
  await getQueue().add(job.type, job)
}
