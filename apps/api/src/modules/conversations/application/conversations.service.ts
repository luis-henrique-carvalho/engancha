import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  contractsVersion,
  EMAIL_CAPTURE_JOB,
  type ContactListQuery,
  type ContactListResponse,
  type ContactSummary,
  type ConversationDetailResponse,
  type ConversationListQuery,
  type ConversationListResponse,
  type ConversationMessage,
  type ConversationSummary,
  type EmailCaptureDetail,
  type EmailCaptureResponseResult,
  type EmailCaptureResponseSubmission,
  type LeadListQuery,
  type LeadListResponse,
  type LeadSummary,
} from '@engancha/contracts'
import { PrismaService } from '../../../platform/database/prisma.service'
import { AuthorizationContext } from '../../../platform/security/authorization-context'
import {
  EMAIL_CAPTURE_DISPATCHER,
  type EmailCaptureDispatcher,
} from '../domain/ports/email-capture-dispatcher.port'

@Injectable()
export class ConversationsService {
  constructor(
    @Inject(PrismaService)
    private readonly database: PrismaService,
    @Inject(EMAIL_CAPTURE_DISPATCHER)
    private readonly dispatcher: EmailCaptureDispatcher,
  ) {}

  async listConversations(
    authContext: AuthorizationContext,
    query: ConversationListQuery,
  ): Promise<ConversationListResponse> {
    const page = Math.max(1, query.page ?? 1)
    const limit = Math.max(1, Math.min(100, query.limit ?? 20))
    const skip = (page - 1) * limit
    const where = this.buildConversationWhere(authContext.organizationId, query)

    const [conversations, total] = await Promise.all([
      this.database.client.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
        include: {
          contact: {
            include: {
              lead: true,
              tags: { include: { tag: true } },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          executions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { automation: true },
          },
        },
      }),
      this.database.client.conversation.count({ where }),
    ])

    return {
      items: conversations.map((conv) => this.mapConversationSummary(conv)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getConversationById(
    authContext: AuthorizationContext,
    conversationId: string,
  ): Promise<ConversationDetailResponse> {
    const conversation = await this.database.client.conversation.findFirst({
      where: {
        id: conversationId,
        organizationId: authContext.organizationId,
      },
      include: {
        contact: {
          include: {
            lead: true,
            tags: { include: { tag: true } },
          },
        },
        messages: {
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          include: { execution: true },
        },
        emailCaptureRequests: {
          orderBy: { createdAt: 'desc' },
        },
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { automation: true },
        },
      },
    })

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada ou acesso não autorizado')
    }

    return this.mapConversationDetail(conversation)
  }

  async listContacts(
    authContext: AuthorizationContext,
    query: ContactListQuery,
  ): Promise<ContactListResponse> {
    const page = Math.max(1, query.page ?? 1)
    const limit = Math.max(1, Math.min(100, query.limit ?? 20))
    const skip = (page - 1) * limit
    const where = this.buildContactWhere(authContext.organizationId, query)

    const [contacts, total] = await Promise.all([
      this.database.client.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ lastInteractionAt: 'desc' }, { id: 'desc' }],
        include: {
          lead: { include: { automation: true } },
          tags: { include: { tag: true } },
        },
      }),
      this.database.client.contact.count({ where }),
    ])

    return {
      items: contacts.map((contact) => this.mapContactSummary(contact)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async listLeads(
    authContext: AuthorizationContext,
    query: LeadListQuery,
  ): Promise<LeadListResponse> {
    const limit = Math.max(1, Math.min(100, query.limit ?? 20))
    const { where, countWhere } = this.buildLeadWhere(authContext.organizationId, query)

    const [itemsWithExtra, total] = await Promise.all([
      this.database.client.lead.findMany({
        where,
        take: limit + 1,
        orderBy: [{ capturedAt: 'desc' }, { id: 'desc' }],
        include: {
          contact: {
            include: {
              tags: { include: { tag: true } },
            },
          },
          automation: {
            include: {
              currentPublishedRevision: true,
            },
          },
        },
      }),
      this.database.client.lead.count({ where: countWhere }),
    ])

    const hasNextPage = itemsWithExtra.length > limit
    const leads = hasNextPage ? itemsWithExtra.slice(0, limit) : itemsWithExtra
    const lastLead = leads[leads.length - 1]
    const nextCursor =
      hasNextPage && lastLead
        ? Buffer.from(
            JSON.stringify({ capturedAt: lastLead.capturedAt.toISOString(), id: lastLead.id }),
          ).toString('base64url')
        : null

    return {
      items: leads.map((lead) => this.mapLeadSummary(lead)),
      meta: {
        limit,
        nextCursor,
        hasNextPage,
        total,
      },
    }
  }

  async submitEmailCaptureResponse(
    authContext: AuthorizationContext,
    conversationId: string,
    captureId: string,
    submission: EmailCaptureResponseSubmission,
  ): Promise<EmailCaptureResponseResult> {
    const capture = await this.database.client.emailCaptureRequest.findFirst({
      where: {
        id: captureId,
        conversationId,
        organizationId: authContext.organizationId,
      },
      include: { contact: true },
    })

    if (!capture) {
      throw new NotFoundException('Captura de e-mail não encontrada ou acesso não autorizado')
    }

    const settledResult = await this.resolveSettledCaptureResponse(authContext, capture, submission)
    if (settledResult) {
      return settledResult
    }

    await this.database.client.emailCaptureRequest.update({
      where: { id: capture.id },
      data: { idempotencyKey: submission.idempotencyKey },
    })

    await this.dispatcher.dispatch({
      type: EMAIL_CAPTURE_JOB,
      version: contractsVersion,
      correlationId: submission.idempotencyKey,
      captureRequestId: capture.id,
      organizationId: authContext.organizationId,
      submittedEmail: submission.email,
      idempotencyKey: submission.idempotencyKey,
    })

    return {
      id: capture.id,
      conversationId: capture.conversationId,
      contactId: capture.contactId,
      status: capture.status,
      messageId: capture.messageId,
      responseMessageId: capture.responseMessageId,
      createdAt: capture.createdAt.toISOString(),
      claimedAt: capture.claimedAt ? capture.claimedAt.toISOString() : null,
      completedAt: capture.completedAt ? capture.completedAt.toISOString() : null,
    }
  }

  private buildConversationWhere(
    organizationId: string,
    query: ConversationListQuery,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = { organizationId }

    if (query.status?.length) where.status = { in: query.status }
    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {}
      if (query.startDate) dateFilter.gte = new Date(query.startDate)
      if (query.endDate) dateFilter.lte = new Date(query.endDate)
      where.lastMessageAt = dateFilter
    }
    if (query.automationId) {
      where.executions = { some: { automationId: query.automationId } }
    }
    if (query.hasLead !== undefined) {
      where.contact = query.hasLead ? { lead: { isNot: null } } : { lead: null }
    }
    if (query.tagId) {
      where.contact = {
        ...(where.contact as Record<string, unknown> | undefined),
        tags: { some: { tagId: query.tagId } },
      }
    }
    if (query.executionStatus?.length) {
      where.executions = {
        ...(where.executions as Record<string, unknown> | undefined),
        some: { status: { in: query.executionStatus } },
      }
    }
    if (query.query?.trim()) {
      const s = query.query.trim()
      where.OR = [
        { contact: { username: { contains: s, mode: 'insensitive' } } },
        { contact: { name: { contains: s, mode: 'insensitive' } } },
        { contact: { emailNormalized: { contains: s.toLowerCase() } } },
        { messages: { some: { text: { contains: s, mode: 'insensitive' } } } },
      ]
    }
    return where
  }

  private mapConversationSummary(conv: any): ConversationSummary {
    const lastMsg = conv.messages[0]
    const lastExec = conv.executions[0]
    return {
      id: conv.id,
      provider: conv.provider,
      mode: conv.mode,
      status: conv.status,
      contact: {
        id: conv.contact.id,
        name: conv.contact.name,
        username: conv.contact.username,
        externalUserId: conv.contact.externalUserId,
        email: conv.contact.email,
      },
      lastMessage: lastMsg
        ? {
            id: lastMsg.id,
            text: lastMsg.text,
            direction: lastMsg.direction,
            type: lastMsg.type,
            createdAt: lastMsg.createdAt.toISOString(),
          }
        : null,
      automation: lastExec?.automation
        ? { id: lastExec.automation.id, name: lastExec.automationId }
        : null,
      lead: conv.contact.lead
        ? {
            id: conv.contact.lead.id,
            capturedAt: conv.contact.lead.capturedAt.toISOString(),
          }
        : null,
      tags: conv.contact.tags.map((ct: any) => ({
        id: ct.tag.id,
        name: ct.tag.name,
        normalizedName: ct.tag.normalizedName,
      })),
      lastMessageAt: conv.lastMessageAt ? conv.lastMessageAt.toISOString() : null,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    }
  }

  private mapConversationDetail(conversation: any): ConversationDetailResponse {
    const messages: ConversationMessage[] = conversation.messages.map((msg: any) => ({
      id: msg.id,
      direction: msg.direction,
      type: msg.type,
      status: msg.status,
      text: msg.text,
      payload: (msg.payload as Record<string, unknown> | null) ?? null,
      position: msg.position,
      sentAt: msg.sentAt ? msg.sentAt.toISOString() : null,
      createdAt: msg.createdAt.toISOString(),
      originExecutionId: msg.executionId,
      originAutomationId: msg.execution?.automationId ?? null,
    }))

    const emailCaptures: EmailCaptureDetail[] = conversation.emailCaptureRequests.map(
      (ec: any) => ({
        id: ec.id,
        status: ec.status,
        messageId: ec.messageId,
        responseMessageId: ec.responseMessageId,
        errorCode: ec.errorCode,
        errorMessage: ec.errorMessage,
        createdAt: ec.createdAt.toISOString(),
        claimedAt: ec.claimedAt ? ec.claimedAt.toISOString() : null,
        completedAt: ec.completedAt ? ec.completedAt.toISOString() : null,
      }),
    )

    const lastExec = conversation.executions[0]
    return {
      id: conversation.id,
      provider: conversation.provider,
      mode: conversation.mode,
      status: conversation.status,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      contact: {
        id: conversation.contact.id,
        name: conversation.contact.name,
        username: conversation.contact.username,
        externalUserId: conversation.contact.externalUserId,
        email: conversation.contact.email,
      },
      tags: conversation.contact.tags.map((ct: any) => ({
        id: ct.tag.id,
        name: ct.tag.name,
        normalizedName: ct.tag.normalizedName,
      })),
      lead: conversation.contact.lead
        ? {
            id: conversation.contact.lead.id,
            capturedAt: conversation.contact.lead.capturedAt.toISOString(),
          }
        : null,
      automation: lastExec?.automation
        ? { id: lastExec.automation.id, name: lastExec.automationId }
        : null,
      messages,
      emailCaptures,
    }
  }

  private buildContactWhere(
    organizationId: string,
    query: ContactListQuery,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = { organizationId }

    if (query.provider?.length) where.provider = { in: query.provider }
    if (query.mode?.length) where.mode = { in: query.mode }
    if (query.tagId) where.tags = { some: { tagId: query.tagId } }
    if (query.leadState === 'LEAD') where.lead = { isNot: null }
    else if (query.leadState === 'NOT_LEAD') where.lead = null

    if (query.query?.trim()) {
      const s = query.query.trim()
      where.OR = [
        { username: { contains: s, mode: 'insensitive' } },
        { name: { contains: s, mode: 'insensitive' } },
        { emailNormalized: { contains: s.toLowerCase() } },
      ]
    }
    return where
  }

  private mapContactSummary(contact: any): ContactSummary {
    return {
      id: contact.id,
      provider: contact.provider,
      mode: contact.mode,
      externalUserId: contact.externalUserId,
      username: contact.username,
      name: contact.name,
      email: contact.email,
      hasEmail: Boolean(contact.email),
      isLead: Boolean(contact.lead),
      lead: contact.lead
        ? {
            id: contact.lead.id,
            capturedAt: contact.lead.capturedAt.toISOString(),
            automationId: contact.lead.automationId,
            automationName: contact.lead.automationId,
          }
        : null,
      tags: contact.tags.map((ct: any) => ({
        id: ct.tag.id,
        name: ct.tag.name,
        normalizedName: ct.tag.normalizedName,
      })),
      lastInteractionAt: contact.lastInteractionAt ? contact.lastInteractionAt.toISOString() : null,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
    }
  }

  private async resolveSettledCaptureResponse(
    authContext: AuthorizationContext,
    capture: any,
    submission: EmailCaptureResponseSubmission,
  ): Promise<EmailCaptureResponseResult | null> {
    if (capture.status === 'SUPERSEDED') {
      throw new ConflictException(
        'Esta solicitação de captura foi substituída por uma mais recente',
      )
    }

    if (capture.status === 'COMPLETED') {
      const lead = await this.database.client.lead.findUnique({
        where: {
          organizationId_contactId: {
            organizationId: authContext.organizationId,
            contactId: capture.contactId,
          },
        },
      })

      return {
        id: capture.id,
        conversationId: capture.conversationId,
        contactId: capture.contactId,
        status: capture.status,
        messageId: capture.messageId,
        responseMessageId: capture.responseMessageId,
        leadId: lead?.id,
        errorCode: capture.errorCode,
        errorMessage: capture.errorMessage,
        createdAt: capture.createdAt.toISOString(),
        claimedAt: capture.claimedAt ? capture.claimedAt.toISOString() : null,
        completedAt: capture.completedAt ? capture.completedAt.toISOString() : null,
      }
    }

    if (capture.idempotencyKey === submission.idempotencyKey) {
      return {
        id: capture.id,
        conversationId: capture.conversationId,
        contactId: capture.contactId,
        status: capture.status,
        messageId: capture.messageId,
        responseMessageId: capture.responseMessageId,
        errorCode: capture.errorCode,
        errorMessage: capture.errorMessage,
        createdAt: capture.createdAt.toISOString(),
        claimedAt: capture.claimedAt ? capture.claimedAt.toISOString() : null,
        completedAt: capture.completedAt ? capture.completedAt.toISOString() : null,
      }
    }

    return null
  }

  private decodeLeadCursor(cursor?: string): { capturedAt: Date; id: string } | null {
    if (!cursor) return null
    try {
      const raw = Buffer.from(cursor, 'base64url').toString('utf8')
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.capturedAt === 'string' && typeof parsed.id === 'string') {
        const d = new Date(parsed.capturedAt)
        if (!isNaN(d.getTime())) {
          return { capturedAt: d, id: parsed.id }
        }
      }
      return null
    } catch {
      return null
    }
  }

  private buildLeadWhere(
    organizationId: string,
    query: LeadListQuery,
  ): { where: Record<string, unknown>; countWhere: Record<string, unknown> } {
    const conditions: Record<string, unknown>[] = [{ organizationId }]

    if (query.provider?.length) {
      conditions.push({ provider: { in: query.provider } })
    }
    if (query.mode?.length) {
      conditions.push({ mode: { in: query.mode } })
    }
    if (query.automationId) {
      conditions.push({
        automation: {
          id: query.automationId,
          organizationId,
        },
      })
    }
    if (query.tagId) {
      conditions.push({
        contact: {
          tags: {
            some: {
              tag: {
                id: query.tagId,
                organizationId,
              },
            },
          },
        },
      })
    }
    if (query.query?.trim()) {
      const s = query.query.trim()
      conditions.push({
        contact: {
          OR: [
            { username: { contains: s, mode: 'insensitive' } },
            { name: { contains: s, mode: 'insensitive' } },
            { emailNormalized: { contains: s.toLowerCase() } },
          ],
        },
      })
    }

    const countWhere = { AND: [...conditions] }

    const cursorDecoded = this.decodeLeadCursor(query.cursor)
    if (cursorDecoded) {
      conditions.push({
        OR: [
          { capturedAt: { lt: cursorDecoded.capturedAt } },
          {
            capturedAt: cursorDecoded.capturedAt,
            id: { lt: cursorDecoded.id },
          },
        ],
      })
    }

    const where = { AND: conditions }

    return { where, countWhere }
  }

  private mapLeadSummary(lead: any): LeadSummary {
    const automationName =
      lead.automation?.currentPublishedRevision?.name ??
      lead.automation?.id ??
      lead.automationId ??
      null

    return {
      id: lead.id,
      capturedAt: lead.capturedAt.toISOString(),
      provider: lead.provider,
      mode: lead.mode,
      contact: {
        id: lead.contact.id,
        name: lead.contact.name,
        username: lead.contact.username,
        externalUserId: lead.contact.externalUserId,
        email: lead.contact.email,
      },
      automation: lead.automationId
        ? {
            id: lead.automationId,
            name: automationName,
          }
        : null,
      originExecutionId: lead.executionId,
      tags: (lead.contact.tags ?? []).map((ct: any) => ({
        id: ct.tag.id,
        name: ct.tag.name,
        normalizedName: ct.tag.normalizedName,
      })),
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    }
  }
}
