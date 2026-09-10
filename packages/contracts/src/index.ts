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
  emailCapture: 'email-capture',
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

export const contentProviderSchema = z.enum(['INSTAGRAM', 'TIKTOK'])
export type ContentProvider = z.infer<typeof contentProviderSchema>

export const contentModeSchema = z.enum(['SIMULATED', 'REAL'])
export type ContentMode = z.infer<typeof contentModeSchema>

export const contentTypeSchema = z.enum(['POST', 'VIDEO'])
export type ContentType = z.infer<typeof contentTypeSchema>

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
    originAutomationId: z.string().trim().min(1).max(255).optional(),
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
  'TAG_APPLICATION',
])
export type ExecutionOutputType = z.infer<typeof executionOutputTypeSchema>

export const channelCapabilitiesSchema = z
  .object({
    provider: z.enum(['INSTAGRAM', 'TIKTOK']),
    mode: z.enum(['SIMULATED', 'REAL']),
    supportedActions: z.array(
      z.enum(['PUBLIC_REPLY', 'PRIVATE_REPLY', 'LINK', 'CAPTURE_EMAIL', 'APPLY_TAG']),
    ),
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
      supportedActions: ['PUBLIC_REPLY', 'PRIVATE_REPLY', 'LINK', 'CAPTURE_EMAIL', 'APPLY_TAG'],
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

export const emailCaptureRequestStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'SUPERSEDED',
])
export type EmailCaptureRequestStatus = z.infer<typeof emailCaptureRequestStatusSchema>

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
    originAutomationId: z.string().nullable().optional(),
    content: z
      .object({
        id: z.string().min(1),
        title: z.string().min(1),
        contentType: z.string().min(1),
        externalContentId: z.string().min(1),
      })
      .strict()
      .nullable()
      .optional(),
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
        name: z.string().nullable().optional(),
      })
      .strict()
      .nullable(),
    contactId: z.string().min(1).nullable().optional(),
    conversationId: z.string().min(1).nullable().optional(),
    emailCapture: z
      .object({
        id: z.string().min(1),
        status: emailCaptureRequestStatusSchema,
        errorCode: z.string().nullable().optional(),
        errorMessage: z.string().nullable().optional(),
      })
      .strict()
      .nullable()
      .optional(),
    outputs: z.array(executionOutputSchema),
    attempts: z.number().int().min(0),
    error: z
      .object({ code: z.string().min(1), message: z.string().min(1) })
      .strict()
      .nullable(),
    stateVersion: z.number().int().min(1),
    createdAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict()
export type SimulationExecutionResponse = z.infer<typeof simulationExecutionResponseSchema>

export const conversationStatusSchema = z.enum(['OPEN', 'CLOSED'])
export type ConversationStatus = z.infer<typeof conversationStatusSchema>

export const messageDirectionSchema = z.enum(['INBOUND', 'OUTBOUND'])
export type MessageDirection = z.infer<typeof messageDirectionSchema>

export const messageTypeSchema = z.enum([
  'COMMENT',
  'INCOMING_MESSAGE',
  'PUBLIC_REPLY',
  'PRIVATE_REPLY',
  'DIRECT_MESSAGE',
  'DIRECT_MESSAGE_WITH_LINK',
  'EMAIL_CAPTURE_REQUEST',
])
export type MessageType = z.infer<typeof messageTypeSchema>

export const messageStatusSchema = z.enum(['PENDING', 'SENT', 'FAILED', 'RECEIVED'])
export type MessageStatus = z.infer<typeof messageStatusSchema>

export function normalizeContactUsername(author: string): string {
  return author.trim().replace(/^@+/, '')
}

export function normalizeContactExternalUserId(author: string): string {
  return normalizeContactUsername(author).toLowerCase()
}

export function normalizeTagName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/^#+/, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
}

export function deterministicCommentMessageExternalId(executionId: string): string {
  return `execution:${executionId}:comment`
}

export function deterministicOutputMessageExternalId(
  executionId: string,
  outputKey: string,
): string {
  return `execution:${executionId}:output:${outputKey}`
}

export function deterministicEmailCaptureRequestId(executionId: string): string {
  return `execution:${executionId}:email-capture`
}

export function normalizeEmail(email: string): string {
  const trimmed = email.trim()
  const atIndex = trimmed.lastIndexOf('@')
  if (atIndex === -1) return trimmed.toLowerCase()
  const localPart = trimmed.slice(0, atIndex)
  const domainPart = trimmed.slice(atIndex + 1).toLowerCase()
  return `${localPart}@${domainPart}`
}

export const EMAIL_CAPTURE_JOB = 'email.capture.response.v1' as const

export const emailCaptureResponseSubmissionSchema = z
  .object({
    email: z.string().trim().email().max(320),
    idempotencyKey: correlationIdSchema,
  })
  .strict()
export type EmailCaptureResponseSubmission = z.infer<typeof emailCaptureResponseSubmissionSchema>

export const emailCaptureResponseResultSchema = z
  .object({
    id: z.string().min(1),
    conversationId: z.string().min(1),
    contactId: z.string().min(1),
    status: emailCaptureRequestStatusSchema,
    messageId: z.string().min(1),
    responseMessageId: z.string().nullable().optional(),
    leadId: z.string().nullable().optional(),
    errorCode: z.string().nullable().optional(),
    errorMessage: z.string().nullable().optional(),
    createdAt: z.string().datetime({ offset: true }),
    claimedAt: z.string().datetime({ offset: true }).nullable().optional(),
    completedAt: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strict()
export type EmailCaptureResponseResult = z.infer<typeof emailCaptureResponseResultSchema>

export const emailCaptureJobSchema = z
  .object({
    type: z.literal(EMAIL_CAPTURE_JOB).default(EMAIL_CAPTURE_JOB),
    version: z.literal(contractsVersion).default(contractsVersion),
    correlationId: correlationIdSchema,
    captureRequestId: z.string().min(1).max(255),
    organizationId: z.string().min(1).max(255),
    submittedEmail: z.string().trim().email().max(320),
    idempotencyKey: correlationIdSchema,
  })
  .strict()
export type EmailCaptureJob = z.infer<typeof emailCaptureJobSchema>

export const emailCaptureJobOptions = {
  attempts: 4,
  backoff: { type: 'exponential', delay: 2_000 },
  removeOnComplete: { age: 3_600, count: 100 },
  removeOnFail: { age: 86_400, count: 100 },
} as const

const normalizeSimulationQueryArray = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .union([schema, z.array(schema)])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional()

export const simulationExecutionListQuerySchema = z
  .object({
    automationId: z.string().trim().min(1).max(255).optional(),
    query: z.string().trim().max(120).optional(),
    status: normalizeSimulationQueryArray(executionStatusSchema),
    provider: normalizeSimulationQueryArray(contentProviderSchema),
    mode: normalizeSimulationQueryArray(contentModeSchema),
    contentType: normalizeSimulationQueryArray(contentTypeSchema),
    outputType: normalizeSimulationQueryArray(executionOutputTypeSchema),
    cursor: z.string().trim().min(1).max(255).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
export type SimulationExecutionListQuery = z.infer<typeof simulationExecutionListQuerySchema>

export const simulationExecutionListResponseSchema = z
  .object({
    items: z.array(simulationExecutionResponseSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
    meta: z
      .object({
        page: z.number().int().min(1),
        limit: z.number().int().min(1),
        total: z.number().int().min(0),
        totalPages: z.number().int().min(0),
      })
      .strict()
      .optional(),
  })
  .strict()
export type SimulationExecutionListResponse = z.infer<typeof simulationExecutionListResponseSchema>

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
  z
    .object({
      type: z.literal('APPLY_TAG'),
      tagId: z.string().min(1).optional(),
      name: z.string().trim().min(1).max(50).optional(),
    })
    .strict()
    .refine((data) => Boolean(data.tagId || data.name), {
      message: 'Either tagId or name is required for APPLY_TAG',
    }),
])
export type AutomationAction = z.infer<typeof automationActionSchema>

export const publishableAutomationSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    targetId: z.string().min(1),
    keyword: z.string().trim().min(1).max(120),
    actions: z.array(automationActionSchema).min(1).max(4),
  })
  .strict()
  .superRefine((automation, context) => {
    const types = automation.actions.map((action) => action.type)
    const terminalActions = types.filter((type) => type === 'LINK' || type === 'CAPTURE_EMAIL')
    const tagActions = types.filter((type) => type === 'APPLY_TAG')

    if (types.at(-1) !== 'LINK' && types.at(-1) !== 'CAPTURE_EMAIL')
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['actions'],
        message: 'The final action must be LINK or CAPTURE_EMAIL',
      })
    if (
      types
        .slice(0, -1)
        .some((type) => type !== 'PUBLIC_REPLY' && type !== 'PRIVATE_REPLY' && type !== 'APPLY_TAG')
    )
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['actions'],
        message: 'Only reply or tag actions may precede the final action',
      })
    if (tagActions.length > 1)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['actions'],
        message: 'At most one tag action is allowed',
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
    actions: z.array(automationActionSchema).max(4).nullable().optional(),
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

export const tagSchema = z
  .object({
    id: z.string().min(1),
    organizationId: z.string().min(1),
    name: z.string().trim().min(1).max(50),
    normalizedName: z.string().trim().min(1).max(50),
    createdAt: responseDateTimeSchema,
    updatedAt: responseDateTimeSchema,
  })
  .strict()
export type Tag = z.infer<typeof tagSchema>
export type TagResponse = Tag

export const tagListResponseSchema = z
  .object({
    items: z.array(tagSchema),
  })
  .strict()
export type TagListResponse = z.infer<typeof tagListResponseSchema>

export const createTagRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(50),
  })
  .strict()
export type CreateTagRequest = z.infer<typeof createTagRequestSchema>

// ==========================================
// Phase 5: Conversations and Contacts Contracts
// ==========================================

export const paginationMetaSchema = z
  .object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })
  .strict()
export type PaginationMeta = z.infer<typeof paginationMetaSchema>

export const conversationSummaryContactSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().nullable().optional(),
    username: z.string().nullable().optional(),
    externalUserId: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
  })
  .strict()
export type ConversationSummaryContact = z.infer<typeof conversationSummaryContactSchema>

export const conversationSummaryMessageSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().nullable().optional(),
    direction: messageDirectionSchema,
    type: messageTypeSchema,
    createdAt: responseDateTimeSchema,
  })
  .strict()
export type ConversationSummaryMessage = z.infer<typeof conversationSummaryMessageSchema>

export const conversationSummaryLeadSchema = z
  .object({
    id: z.string().min(1),
    capturedAt: responseDateTimeSchema,
  })
  .strict()
export type ConversationSummaryLead = z.infer<typeof conversationSummaryLeadSchema>

export const conversationSummaryTagSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    normalizedName: z.string().min(1),
  })
  .strict()
export type ConversationSummaryTag = z.infer<typeof conversationSummaryTagSchema>

export const conversationSummaryAutomationSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().nullable().optional(),
  })
  .strict()
export type ConversationSummaryAutomation = z.infer<typeof conversationSummaryAutomationSchema>

export const conversationSummarySchema = z
  .object({
    id: z.string().min(1),
    provider: contentProviderSchema,
    mode: contentModeSchema,
    status: conversationStatusSchema,
    contact: conversationSummaryContactSchema,
    lastMessage: conversationSummaryMessageSchema.nullable().optional(),
    automation: conversationSummaryAutomationSchema.nullable().optional(),
    lead: conversationSummaryLeadSchema.nullable().optional(),
    tags: z.array(conversationSummaryTagSchema),
    lastMessageAt: responseDateTimeSchema.nullable().optional(),
    createdAt: responseDateTimeSchema,
    updatedAt: responseDateTimeSchema,
  })
  .strict()
export type ConversationSummary = z.infer<typeof conversationSummarySchema>

const normalizeQueryArray = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .union([schema, z.array(schema)])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional()

export const conversationListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    query: z.string().trim().max(120).optional(),
    startDate: z.string().datetime({ offset: true }).optional(),
    endDate: z.string().datetime({ offset: true }).optional(),
    automationId: z.string().trim().min(1).max(255).optional(),
    hasLead: z
      .union([z.boolean(), z.enum(['true', 'false'])])
      .transform((val) => (typeof val === 'boolean' ? val : val === 'true'))
      .optional(),
    tagId: z.string().trim().min(1).max(255).optional(),
    status: normalizeQueryArray(conversationStatusSchema),
    executionStatus: normalizeQueryArray(executionStatusSchema),
  })
  .strict()
export type ConversationListQuery = z.infer<typeof conversationListQuerySchema>

export const conversationListResponseSchema = z
  .object({
    items: z.array(conversationSummarySchema),
    meta: paginationMetaSchema,
  })
  .strict()
export type ConversationListResponse = z.infer<typeof conversationListResponseSchema>

export const conversationMessageSchema = z
  .object({
    id: z.string().min(1),
    direction: messageDirectionSchema,
    type: messageTypeSchema,
    status: messageStatusSchema,
    text: z.string().nullable().optional(),
    payload: z.record(z.string(), z.unknown()).nullable().optional(),
    position: z.number().int().nullable().optional(),
    sentAt: responseDateTimeSchema.nullable().optional(),
    createdAt: responseDateTimeSchema,
    originExecutionId: z.string().nullable().optional(),
    originAutomationId: z.string().nullable().optional(),
  })
  .strict()
export type ConversationMessage = z.infer<typeof conversationMessageSchema>

export const emailCaptureDetailSchema = z
  .object({
    id: z.string().min(1),
    status: emailCaptureRequestStatusSchema,
    messageId: z.string().min(1),
    responseMessageId: z.string().nullable().optional(),
    errorCode: z.string().nullable().optional(),
    errorMessage: z.string().nullable().optional(),
    createdAt: responseDateTimeSchema,
    claimedAt: responseDateTimeSchema.nullable().optional(),
    completedAt: responseDateTimeSchema.nullable().optional(),
  })
  .strict()
export type EmailCaptureDetail = z.infer<typeof emailCaptureDetailSchema>

export const conversationDetailResponseSchema = z
  .object({
    id: z.string().min(1),
    provider: contentProviderSchema,
    mode: contentModeSchema,
    status: conversationStatusSchema,
    createdAt: responseDateTimeSchema,
    updatedAt: responseDateTimeSchema,
    contact: conversationSummaryContactSchema,
    tags: z.array(conversationSummaryTagSchema),
    lead: conversationSummaryLeadSchema.nullable().optional(),
    automation: conversationSummaryAutomationSchema.nullable().optional(),
    messages: z.array(conversationMessageSchema),
    emailCaptures: z.array(emailCaptureDetailSchema),
  })
  .strict()
export type ConversationDetailResponse = z.infer<typeof conversationDetailResponseSchema>

export const contactLeadSchema = z
  .object({
    id: z.string().min(1),
    capturedAt: responseDateTimeSchema,
    automationId: z.string().nullable().optional(),
    automationName: z.string().nullable().optional(),
  })
  .strict()
export type ContactLead = z.infer<typeof contactLeadSchema>

export const contactSummarySchema = z
  .object({
    id: z.string().min(1),
    provider: contentProviderSchema,
    mode: contentModeSchema,
    externalUserId: z.string().nullable().optional(),
    username: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    hasEmail: z.boolean(),
    isLead: z.boolean(),
    lead: contactLeadSchema.nullable().optional(),
    tags: z.array(conversationSummaryTagSchema),
    lastInteractionAt: responseDateTimeSchema.nullable().optional(),
    createdAt: responseDateTimeSchema,
    updatedAt: responseDateTimeSchema,
  })
  .strict()
export type ContactSummary = z.infer<typeof contactSummarySchema>

export const contactListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    query: z.string().trim().max(120).optional(),
    provider: normalizeQueryArray(contentProviderSchema),
    mode: normalizeQueryArray(contentModeSchema),
    tagId: z.string().trim().min(1).max(255).optional(),
    leadState: z.enum(['ALL', 'LEAD', 'NOT_LEAD']).optional(),
  })
  .strict()
export type ContactListQuery = z.infer<typeof contactListQuerySchema>

export const contactListResponseSchema = z
  .object({
    items: z.array(contactSummarySchema),
    meta: paginationMetaSchema,
  })
  .strict()
export type ContactListResponse = z.infer<typeof contactListResponseSchema>
