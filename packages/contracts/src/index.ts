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
    type: z.enum(['verification', 'password-reset', 'organization-invitation']),
    to: emailAddressSchema,
    actionUrl: emailActionUrlSchema,
  })
  .strict()

export type EmailDeliveryJob = z.infer<typeof emailDeliveryJobSchema>

export const developmentEmailOutboxEntrySchema = z
  .object({
    type: z.enum(['verification', 'password-reset', 'organization-invitation']),
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

export const workspaceListResponseSchema = z.array(activeWorkspaceResponseSchema)

export type WorkspaceListResponse = z.infer<typeof workspaceListResponseSchema>

export const switchActiveWorkspaceRequestSchema = z
  .object({
    organizationId: z.string().trim().min(1).max(255),
  })
  .strict()

export type SwitchActiveWorkspaceRequest = z.infer<typeof switchActiveWorkspaceRequestSchema>

export const createWorkspaceRequestSchema = z
  .object({ name: z.string().trim().min(2).max(80) })
  .strict()

export type CreateWorkspaceRequest = z.infer<typeof createWorkspaceRequestSchema>

export const invitationRequestSchema = z.object({ email: emailAddressSchema }).strict()
export type InvitationRequest = z.infer<typeof invitationRequestSchema>

export const workspaceMemberSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).max(255),
    email: emailAddressSchema,
    emailVerified: z.boolean(),
    role: z.enum(['owner', 'admin', 'member']),
    status: z.enum(['active', 'invited']),
  })
  .strict()

export type WorkspaceMember = z.infer<typeof workspaceMemberSchema>
export const workspaceMembersResponseSchema = z.array(workspaceMemberSchema)
export type WorkspaceMembersResponse = z.infer<typeof workspaceMembersResponseSchema>

export const workspaceMembersListRequestSchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    query: z.string().trim().max(120).optional(),
    role: z.array(z.enum(['owner', 'admin', 'member'])).optional(),
    status: z.array(z.enum(['active', 'invited'])).optional(),
  })
  .strict()

export type WorkspaceMembersListRequest = z.infer<typeof workspaceMembersListRequestSchema>

export const workspaceMembersListResponseSchema = z
  .object({
    items: workspaceMembersResponseSchema,
    meta: z
      .object({
        page: z.number().int().min(1),
        limit: z.number().int().min(1),
        total: z.number().int().min(0),
        totalPages: z.number().int().min(0),
      })
      .strict(),
  })
  .strict()

export type WorkspaceMembersListResponse = z.infer<typeof workspaceMembersListResponseSchema>

export const automationStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'])
export const automationActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PUBLIC_REPLY'), text: z.string().trim().min(1).max(1000) }).strict(),
  z.object({ type: z.literal('PRIVATE_REPLY'), text: z.string().trim().min(1).max(1000) }).strict(),
  z
    .object({
      type: z.literal('LINK'),
      url: z.string().url().max(2048),
      label: z.string().trim().min(1).max(80).default('Abrir link'),
    })
    .strict(),
  z
    .object({ type: z.literal('CAPTURE_EMAIL'), prompt: z.string().trim().min(1).max(300) })
    .strict(),
])
export type AutomationAction = z.infer<typeof automationActionSchema>

export function normalizeAutomationKeyword(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function validatePublishableAutomation(input: {
  name?: string | null
  targetId?: string | null
  keyword?: string | null
  actions: unknown[]
}): string[] {
  const issues: string[] = []
  if (!input.name?.trim()) issues.push('name')
  if (!input.targetId) issues.push('targetId')
  if (!input.keyword?.trim()) issues.push('keyword')
  const parsed = z.array(automationActionSchema).safeParse(input.actions)
  if (!parsed.success) return [...issues, 'actions']
  const types = parsed.data.map((action) => action.type)
  if (types.at(-1) !== 'LINK' && types.at(-1) !== 'CAPTURE_EMAIL') issues.push('actions')
  if (types.slice(0, -1).some((type) => type !== 'PUBLIC_REPLY' && type !== 'PRIVATE_REPLY'))
    issues.push('actions')
  if (types.filter((type) => type === 'LINK' || type === 'CAPTURE_EMAIL').length !== 1)
    issues.push('actions')
  return [...new Set(issues)]
}

const automationBaseSchema = z
  .object({ name: z.string().trim().min(1).max(80).optional() })
  .strict()
export const createAutomationRequestSchema = automationBaseSchema
export type CreateAutomationRequest = z.infer<typeof createAutomationRequestSchema>
export const patchAutomationRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(80).nullable().optional(),
    targetId: z.string().min(1).nullable().optional(),
    keyword: z.string().trim().min(1).max(120).nullable().optional(),
    actions: z.array(automationActionSchema).max(3).nullable().optional(),
  })
  .strict()
export type PatchAutomationRequest = z.infer<typeof patchAutomationRequestSchema>
export const createSimulatedContentRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    externalContentId: z.string().trim().min(1).max(255),
  })
  .strict()
export type CreateSimulatedContentRequest = z.infer<typeof createSimulatedContentRequestSchema>
export const paginationRequestSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
export type PaginationRequest = z.infer<typeof paginationRequestSchema>
