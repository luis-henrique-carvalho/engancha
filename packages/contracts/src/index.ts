import { z } from 'zod'

export const contractsVersion = 'v1' as const

const correlationIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)

const verificationJobPayloadSchema = z.object({}).strict()

export const verificationJobSchema = z
  .object({
    version: z.literal(contractsVersion),
    correlationId: correlationIdSchema,
    payload: verificationJobPayloadSchema,
  })
  .strict()

export type VerificationJob = z.infer<typeof verificationJobSchema>

export const queueNames = {
  verification: 'verification',
  emailDelivery: 'email-delivery',
  automationExecution: 'automation-execution',
  messageDelivery: 'message-delivery',
  analytics: 'analytics',
} as const

export type QueueName = (typeof queueNames)[keyof typeof queueNames]

export const verificationJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1_000,
  },
  removeOnComplete: {
    age: 3_600,
    count: 100,
  },
  removeOnFail: {
    age: 86_400,
    count: 100,
  },
} as const
