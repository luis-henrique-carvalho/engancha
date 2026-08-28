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

export const executionStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'IGNORED',
  'FAILED',
])
export type ExecutionStatus = z.infer<typeof executionStatusSchema>

const simulationProviderSchema = z.literal('INSTAGRAM')
const simulationAuthorSchema = z.string().trim().min(1).max(120)
const simulationCommentTextSchema = z.string().trim().min(1).max(1_000)

export const simulationCommentRequestSchema = z
  .object({
    contentId: z.string().trim().min(1).max(255),
    provider: simulationProviderSchema,
    author: simulationAuthorSchema,
    text: simulationCommentTextSchema,
    commentId: z.string().trim().min(1).max(255).optional(),
    idempotencyKey: correlationIdSchema,
  })
  .strict()
export type SimulationCommentRequest = z.infer<typeof simulationCommentRequestSchema>

export const AUTOMATION_EXECUTION_REQUESTED = 'automation.execution.requested.v1' as const

export const automationExecutionRequestedSchema = z
  .object({
    type: z.literal(AUTOMATION_EXECUTION_REQUESTED),
    version: z.literal(contractsVersion),
    correlationId: correlationIdSchema,
    executionId: z.string().min(1).max(255),
    organizationId: z.string().min(1).max(255),
  })
  .strict()
export type AutomationExecutionRequested = z.infer<typeof automationExecutionRequestedSchema>

export const automationExecutionJobSchema = automationExecutionRequestedSchema
export type AutomationExecutionJob = AutomationExecutionRequested

export const automationExecutionJobOptions = {
  attempts: 4,
  backoff: { type: 'exponential', delay: 2_000 },
  removeOnComplete: { age: 3_600, count: 100 },
  removeOnFail: { age: 86_400, count: 100 },
} as const

export const simulationCommentResponseSchema = z
  .object({
    executionId: z.string().min(1),
    status: executionStatusSchema,
    simulated: z.literal(true),
  })
  .strict()
export type SimulationCommentResponse = z.infer<typeof simulationCommentResponseSchema>

export const executionOutputTypeSchema = z.enum([
  'PUBLIC_REPLY',
  'PRIVATE_REPLY',
  'LINK_DELIVERY',
  'EMAIL_CAPTURE_REQUEST',
])
export type ExecutionOutputType = z.infer<typeof executionOutputTypeSchema>

export const channelCapabilitiesSchema = z
  .object({
    provider: z.enum(['INSTAGRAM', 'TIKTOK']),
    mode: z.enum(['SIMULATED', 'REAL']),
    supportedActions: z.array(z.enum(['PUBLIC_REPLY', 'PRIVATE_REPLY', 'LINK', 'CAPTURE_EMAIL'])),
    publicReply: z.boolean(),
    privateReply: z.boolean(),
    linkDelivery: z.boolean(),
    emailCapture: z.boolean(),
  })
  .strict()

export type ChannelCapabilities = z.infer<typeof channelCapabilitiesSchema>

export function getChannelCapabilities(provider: string, mode: string): ChannelCapabilities {
  if (provider === 'INSTAGRAM' && mode === 'SIMULATED') {
    return {
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      supportedActions: ['PUBLIC_REPLY', 'PRIVATE_REPLY', 'LINK', 'CAPTURE_EMAIL'],
      publicReply: true,
      privateReply: true,
      linkDelivery: true,
      emailCapture: true,
    }
  }

  return {
    provider: provider as 'INSTAGRAM' | 'TIKTOK',
    mode: mode as 'SIMULATED' | 'REAL',
    supportedActions: [],
    publicReply: false,
    privateReply: false,
    linkDelivery: false,
    emailCapture: false,
  }
}

const executionOutputSchema = z
  .object({
    id: z.string().min(1),
    key: z.string().min(1),
    position: z.number().int().min(0),
    type: executionOutputTypeSchema,
    payload: z.record(z.string(), z.unknown()),
    createdAt: z.string().datetime({ offset: true }),
  })
  .strict()

export const simulationExecutionResponseSchema = z
  .object({
    id: z.string().min(1),
    status: executionStatusSchema,
    simulated: z.literal(true),
    provider: simulationProviderSchema,
    contentId: z.string().min(1),
    input: z
      .object({
        author: simulationAuthorSchema,
        text: simulationCommentTextSchema,
        commentId: z.string().nullable(),
        submittedAt: z.string().datetime({ offset: true }),
      })
      .strict(),
    matched: z.boolean().nullable(),
    automation: z
      .object({
        id: z.string().min(1),
        revisionId: z.string().min(1),
        version: z.number().int().min(1),
      })
      .strict()
      .nullable(),
    outputs: z.array(executionOutputSchema),
    attempts: z.number().int().min(0),
    error: z
      .object({ code: z.string().min(1), message: z.string().min(1) })
      .strict()
      .nullable(),
    stateVersion: z.number().int().min(1),
  })
  .strict()
export type SimulationExecutionResponse = z.infer<typeof simulationExecutionResponseSchema>

export const simulationSseHeartbeatSchema = z
  .object({
    heartbeat: z.literal(true),
    timestamp: z.string().datetime({ offset: true }),
  })
  .strict()
export type SimulationSseHeartbeat = z.infer<typeof simulationSseHeartbeatSchema>

export const simulationSseEventSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('snapshot'),
      id: z.string().min(1),
      data: simulationExecutionResponseSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal('update'),
      id: z.string().min(1),
      data: simulationExecutionResponseSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal('heartbeat'),
      data: simulationSseHeartbeatSchema,
    })
    .strict(),
])
export type SimulationSseEvent = z.infer<typeof simulationSseEventSchema>

export const SIMULATION_UPDATED_EVENT = 'simulation.execution.updated.v1' as const

export const simulationUpdatedEventSchema = z
  .object({
    type: z.literal(SIMULATION_UPDATED_EVENT).default(SIMULATION_UPDATED_EVENT),
    version: z.literal(contractsVersion).default(contractsVersion),
    executionId: z.string().min(1).max(255),
    organizationId: z.string().min(1).max(255),
    stateVersion: z.number().int().min(1),
    status: executionStatusSchema,
    timestamp: z.string().datetime({ offset: true }),
  })
  .strict()

export type SimulationUpdatedEvent = z.infer<typeof simulationUpdatedEventSchema>

export function simulationExecutionChannel(executionId: string): string {
  return `simulation:execution:${executionId}`
}

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

export const statusResponseSchema = z
  .object({
    status: z.literal('ok'),
    service: z.literal('api'),
  })
  .strict()

export type StatusResponse = z.infer<typeof statusResponseSchema>

const healthDependencyStateSchema = z.object({ status: z.enum(['up', 'down']) }).strict()

export const healthReportSchema = z
  .object({
    status: z.enum(['ok', 'error']),
    service: z.literal('api'),
    checks: z
      .object({
        application: healthDependencyStateSchema,
        postgres: healthDependencyStateSchema,
        redis: healthDependencyStateSchema,
      })
      .strict(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .strict()

export type HealthReportResponse = z.infer<typeof healthReportSchema>

export const livenessResponseSchema = healthReportSchema.pick({
  status: true,
  service: true,
  timestamp: true,
})
export type LivenessResponse = z.infer<typeof livenessResponseSchema>

export const verificationEnqueueResponseSchema = z
  .object({
    jobId: z.string().min(1),
    correlationId: correlationIdSchema,
  })
  .strict()

export type VerificationEnqueueResponse = z.infer<typeof verificationEnqueueResponseSchema>

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
export type AutomationStatus = z.infer<typeof automationStatusSchema>
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

export const publishableAutomationSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    targetId: z.string().min(1),
    keyword: z.string().trim().min(1).max(120),
    actions: z.array(automationActionSchema).min(1).max(3),
  })
  .strict()
  .superRefine((automation, context) => {
    const types = automation.actions.map((action) => action.type)
    const terminalActions = types.filter((type) => type === 'LINK' || type === 'CAPTURE_EMAIL')

    if (types.at(-1) !== 'LINK' && types.at(-1) !== 'CAPTURE_EMAIL')
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['actions'],
        message: 'The final action must be LINK or CAPTURE_EMAIL',
      })
    if (types.slice(0, -1).some((type) => type !== 'PUBLIC_REPLY' && type !== 'PRIVATE_REPLY'))
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['actions'],
        message: 'Only reply actions may precede the final action',
      })
    if (terminalActions.length !== 1)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['actions'],
        message: 'Exactly one final action is required',
      })
  })

export type PublishableAutomation = z.infer<typeof publishableAutomationSchema>

export const automationSnapshotSchema = z
  .object({
    automationId: z.string().min(1),
    revisionId: z.string().min(1),
    version: z.number().int().min(1),
    target: z
      .object({
        contentId: z.string().min(1),
      })
      .strict(),
    trigger: z
      .object({
        type: z.string().min(1),
        keyword: z.string().min(1),
        keywordNormalized: z.string().min(1),
      })
      .strict(),
    actions: z.array(
      z
        .object({
          position: z.number().int().min(0),
          type: z.string().min(1),
          config: z.record(z.string(), z.unknown()),
        })
        .strict(),
    ),
  })
  .strict()
export type AutomationSnapshot = z.infer<typeof automationSnapshotSchema>

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function normalizeAutomationKeyword(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function normalizeAutomationText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function matchesAutomationKeyword(commentText: string, keyword: string): boolean {
  const normalizedKeyword = normalizeAutomationText(keyword)
  if (!normalizedKeyword) return false

  const normalizedComment = normalizeAutomationText(commentText)
  if (!normalizedComment) return false

  const pattern = new RegExp(`(^|\\s)${escapeRegex(normalizedKeyword)}(\\s|$)`, 'i')
  return pattern.test(normalizedComment)
}

export function validatePublishableAutomation(input: {
  name?: string | null
  targetId?: string | null
  keyword?: string | null
  actions: unknown[]
}): string[] {
  const parsed = publishableAutomationSchema.safeParse(input)
  if (parsed.success) return []
  return [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? 'actions')))]
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
export const createContentRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    externalContentId: z.string().trim().min(1).max(255),
    provider: z.enum(['INSTAGRAM', 'TIKTOK']).default('INSTAGRAM'),
    mode: z.enum(['SIMULATED', 'REAL']).default('SIMULATED'),
    contentType: z.enum(['POST', 'VIDEO']).default('POST'),
  })
  .strict()
export type CreateContentRequest = z.infer<typeof createContentRequestSchema>

const responseDateTimeSchema = z.string().datetime({ offset: true })
export const contentResponseSchema = z
  .object({
    id: z.string().min(1),
    organizationId: z.string().min(1),
    title: z.string().min(1).max(160),
    externalContentId: z.string().min(1).max(255),
    provider: z.enum(['INSTAGRAM', 'TIKTOK']),
    mode: z.enum(['SIMULATED', 'REAL']),
    contentType: z.enum(['POST', 'VIDEO']),
    createdAt: responseDateTimeSchema,
    updatedAt: responseDateTimeSchema,
  })
  .strict()
export type ContentResponse = z.infer<typeof contentResponseSchema>

export const contentListResponseSchema = z
  .object({
    items: z.array(contentResponseSchema),
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

export type ContentListResponse = z.infer<typeof contentListResponseSchema>

export const automationRevisionResponseSchema = z
  .object({
    id: z.string().min(1),
    version: z.number().int().min(1),
    name: z.string().nullable(),
    target: contentResponseSchema.nullable(),
    keyword: z.string().nullable(),
    actions: z.array(automationActionSchema),
  })
  .strict()
export type AutomationRevisionResponse = z.infer<typeof automationRevisionResponseSchema>

export const automationResponseSchema = z
  .object({
    id: z.string().min(1),
    status: automationStatusSchema,
    createdAt: responseDateTimeSchema,
    updatedAt: responseDateTimeSchema,
    hasUnpublishedChanges: z.boolean(),
    executionCount: z.number().int().min(0),
    leadCount: z.number().int().min(0),
    draft: automationRevisionResponseSchema.nullable(),
    published: automationRevisionResponseSchema.nullable(),
    current: automationRevisionResponseSchema.nullable(),
  })
  .strict()
export type AutomationResponse = z.infer<typeof automationResponseSchema>

export const automationListRequestSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    query: z.string().trim().max(120).optional(),
    status: z
      .union([automationStatusSchema, z.array(automationStatusSchema)])
      .transform((v) => (Array.isArray(v) ? v : [v]))
      .optional(),
  })
  .strict()

export type AutomationListRequest = z.infer<typeof automationListRequestSchema>

export const automationListResponseSchema = z
  .object({
    items: z.array(automationResponseSchema),
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
export type AutomationListResponse = z.infer<typeof automationListResponseSchema>
export const paginationRequestSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
export type PaginationRequest = z.infer<typeof paginationRequestSchema>
