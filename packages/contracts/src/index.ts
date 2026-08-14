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

export const QUEUE_NAMES = {
  verification: 'verification',
  emailDelivery: 'email-delivery',
  automationExecution: 'automation-execution',
  messageDelivery: 'message-delivery',
  analytics: 'analytics',
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

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

const emailAddressSchema = z.string().trim().email().max(320)
const emailActionUrlSchema = z.string().url().max(2048)

export const emailDeliveryJobSchema = z
  .object({
    version: z.literal(contractsVersion),
    correlationId: correlationIdSchema,
    type: z.enum(['verification', 'password-reset']),
    to: emailAddressSchema,
    actionUrl: emailActionUrlSchema,
  })
  .strict()

export type EmailDeliveryJob = z.infer<typeof emailDeliveryJobSchema>

export const developmentEmailOutboxEntrySchema = z
  .object({
    type: z.enum(['verification', 'password-reset']),
    actionUrl: emailActionUrlSchema,
  })
  .strict()

export type DevelopmentEmailOutboxEntry = z.infer<typeof developmentEmailOutboxEntrySchema>

export const DEVELOPMENT_EMAIL_OUTBOX_TTL_SECONDS = 3_600

export function developmentEmailOutboxKey(correlationId: string): string {
  return `development:email-outbox:${correlationId}`
}

export const emailDeliveryJobOptions = {
  attempts: 4,
  backoff: { type: 'exponential', delay: 2_000 },
  removeOnComplete: { age: 3_600, count: 100 },
  removeOnFail: { age: 86_400, count: 100 },
} as const

export const activeWorkspaceResponseSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().min(1),
    role: z.string().min(1),
  })
  .strict()

export type ActiveWorkspaceResponse = z.infer<typeof activeWorkspaceResponseSchema>
