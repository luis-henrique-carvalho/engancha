import { Inject, Injectable } from '@nestjs/common'
import { normalizeEmail, normalizeTagName, type EmailCaptureJob } from '@engancha/contracts'
import { PrismaService } from '../../../platform/database/prisma.service'
import type { Prisma } from '../../../platform/database/client'
import type {
  EmailCaptureRepository,
  ProcessEmailCaptureResult,
} from '../../domain/ports/email-capture-repository.port'

type ClaimedCapture = Prisma.EmailCaptureRequestGetPayload<{
  include: { contact: true; execution: true; conversation: true }
}>

@Injectable()
export class PrismaEmailCaptureRepository implements EmailCaptureRepository {
  constructor(@Inject(PrismaService) private readonly database: PrismaService) {}

  async claimAndProcess(job: EmailCaptureJob): Promise<ProcessEmailCaptureResult> {
    const { captureRequestId, organizationId, submittedEmail } = job
    const normalized = normalizeEmail(submittedEmail)

    return await this.database.client.$transaction(async (tx) => {
      const claimed = await this.findAndClaimCapture(tx, captureRequestId, organizationId)
      if ('settled' in claimed) {
        return claimed.settled
      }
      const { capture } = claimed

      const conflictResult = await this.checkIdentityConflict(
        tx,
        capture,
        organizationId,
        normalized,
      )
      if (conflictResult) {
        return conflictResult
      }

      const interactionAt = new Date()
      const responseMessage = await this.ensureInboundResponseMessage(
        tx,
        capture,
        organizationId,
        submittedEmail,
        interactionAt,
      )

      await tx.contact.update({
        where: { id: capture.contactId },
        data: {
          email: submittedEmail,
          emailNormalized: normalized,
          lastInteractionAt: interactionAt,
        },
      })

      await tx.conversation.update({
        where: { id: capture.conversationId },
        data: { lastMessageAt: interactionAt },
      })

      const lead = await this.findOrCreateFirstLead(tx, capture, organizationId, interactionAt)
      await this.applyAutomationTagIfPresent(tx, capture, organizationId)

      await tx.emailCaptureRequest.update({
        where: { id: capture.id },
        data: {
          status: 'COMPLETED',
          responseMessageId: responseMessage.id,
          completedAt: new Date(),
          errorCode: null,
          errorMessage: null,
        },
      })

      return {
        captureId: capture.id,
        conversationId: capture.conversationId,
        contactId: capture.contactId,
        leadId: lead.id,
        status: 'COMPLETED',
      }
    })
  }

  private async findAndClaimCapture(
    tx: Prisma.TransactionClient,
    captureRequestId: string,
    organizationId: string,
  ): Promise<{ settled: ProcessEmailCaptureResult } | { capture: ClaimedCapture }> {
    const capture = await tx.emailCaptureRequest.findFirst({
      where: { id: captureRequestId, organizationId },
      include: { contact: true, execution: true, conversation: true },
    })

    if (!capture) {
      throw new Error(
        `Email capture request ${captureRequestId} not found for org ${organizationId}`,
      )
    }

    if (capture.status === 'COMPLETED' || capture.status === 'SUPERSEDED') {
      const settled = await this.buildSettledCaptureResult(tx, capture, organizationId)
      return { settled }
    }

    await tx.emailCaptureRequest.updateMany({
      where: { id: captureRequestId, organizationId, status: 'PENDING' },
      data: { status: 'PROCESSING', claimedAt: new Date(), attempts: { increment: 1 } },
    })

    return { capture }
  }

  private async buildSettledCaptureResult(
    tx: Prisma.TransactionClient,
    capture: any,
    organizationId: string,
  ): Promise<ProcessEmailCaptureResult> {
    if (capture.status === 'COMPLETED') {
      const lead = await tx.lead.findUnique({
        where: { organizationId_contactId: { organizationId, contactId: capture.contactId } },
      })
      return {
        captureId: capture.id,
        conversationId: capture.conversationId,
        contactId: capture.contactId,
        leadId: lead?.id,
        status: 'COMPLETED',
      }
    }
    return {
      captureId: capture.id,
      conversationId: capture.conversationId,
      contactId: capture.contactId,
      status: 'SUPERSEDED',
    }
  }

  private async checkIdentityConflict(
    tx: Prisma.TransactionClient,
    capture: any,
    organizationId: string,
    normalized: string,
  ): Promise<ProcessEmailCaptureResult | null> {
    const conflicting = await tx.contact.findFirst({
      where: { organizationId, emailNormalized: normalized, id: { not: capture.contactId } },
    })

    if (!conflicting) return null

    const errorMessage =
      'O e-mail informado já está associado a outro contato neste espaço de trabalho.'
    await tx.emailCaptureRequest.update({
      where: { id: capture.id },
      data: { status: 'PENDING', errorCode: 'IDENTITY_CONFLICT', errorMessage },
    })

    return {
      captureId: capture.id,
      conversationId: capture.conversationId,
      contactId: capture.contactId,
      status: 'FAILED',
      errorCode: 'IDENTITY_CONFLICT',
      errorMessage,
    }
  }

  async markFailed(params: {
    captureRequestId: string
    organizationId: string
    errorCode: string
    errorMessage: string
  }): Promise<void> {
    await this.database.client.emailCaptureRequest.updateMany({
      where: {
        id: params.captureRequestId,
        organizationId: params.organizationId,
      },
      data: {
        errorCode: params.errorCode,
        errorMessage: params.errorMessage,
        status: 'PENDING',
      },
    })
  }

  private async ensureInboundResponseMessage(
    tx: Prisma.TransactionClient,
    capture: {
      id: string
      conversationId: string
      executionId: string
      conversation: { provider: any; mode: any }
    },
    organizationId: string,
    submittedEmail: string,
    interactionAt: Date,
  ) {
    const responseExternalId = `capture:${capture.id}:response`

    let responseMessage = await tx.message.findFirst({
      where: {
        conversationId: capture.conversationId,
        externalId: responseExternalId,
      },
    })

    if (!responseMessage) {
      const lastMsg = await tx.message.findFirst({
        where: { conversationId: capture.conversationId },
        orderBy: { position: 'desc' },
        select: { position: true },
      })
      const nextPosition = (lastMsg?.position ?? 0) + 1

      responseMessage = await tx.message.create({
        data: {
          organizationId,
          conversationId: capture.conversationId,
          executionId: capture.executionId,
          direction: 'INBOUND',
          type: 'INCOMING_MESSAGE',
          provider: capture.conversation.provider,
          mode: capture.conversation.mode,
          externalId: responseExternalId,
          text: submittedEmail,
          position: nextPosition,
          payload: {
            captureRequestId: capture.id,
            isCaptureResponse: true,
            submittedEmail,
          },
          status: 'RECEIVED',
          sentAt: interactionAt,
        },
      })
    }

    return responseMessage
  }

  private async findOrCreateFirstLead(
    tx: Prisma.TransactionClient,
    capture: {
      id: string
      contactId: string
      automationId: string | null
      automationRevisionId: string | null
      executionId: string
      conversation: { provider: any; mode: any }
    },
    organizationId: string,
    interactionAt: Date,
  ) {
    let lead = await tx.lead.findUnique({
      where: {
        organizationId_contactId: {
          organizationId,
          contactId: capture.contactId,
        },
      },
    })

    if (!lead) {
      try {
        lead = await tx.lead.create({
          data: {
            organizationId,
            contactId: capture.contactId,
            automationId: capture.automationId,
            executionId: capture.executionId,
            provider: capture.conversation.provider,
            mode: capture.conversation.mode,
            capturedAt: interactionAt,
          },
        })
      } catch {
        lead = await tx.lead.findUniqueOrThrow({
          where: {
            organizationId_contactId: {
              organizationId,
              contactId: capture.contactId,
            },
          },
        })
      }
    }

    return lead
  }

  private async resolveTagIdFromConfig(
    tx: Prisma.TransactionClient,
    config: Record<string, unknown>,
    organizationId: string,
  ): Promise<string | undefined> {
    if (config.tagId && typeof config.tagId === 'string') {
      return config.tagId
    }

    if (typeof config.name === 'string' && config.name.trim()) {
      const normalizedName = normalizeTagName(config.name)
      let tag = await tx.tag.findUnique({
        where: { organizationId_normalizedName: { organizationId, normalizedName } },
      })

      if (!tag) {
        try {
          tag = await tx.tag.create({
            data: { organizationId, name: config.name.trim(), normalizedName },
          })
        } catch {
          tag = await tx.tag.findUniqueOrThrow({
            where: { organizationId_normalizedName: { organizationId, normalizedName } },
          })
        }
      }
      return tag.id
    }

    return undefined
  }

  private async applyAutomationTagIfPresent(
    tx: Prisma.TransactionClient,
    capture: {
      contactId: string
      executionId: string
      automationId: string | null
      automationRevisionId: string | null
    },
    organizationId: string,
  ): Promise<void> {
    if (!capture.automationRevisionId) return

    const tagAction = await tx.automationAction.findFirst({
      where: { revisionId: capture.automationRevisionId, type: 'APPLY_TAG' },
    })

    if (!tagAction || !tagAction.config || typeof tagAction.config !== 'object') return

    const tagId = await this.resolveTagIdFromConfig(
      tx,
      tagAction.config as Record<string, unknown>,
      organizationId,
    )
    if (!tagId) return

    const tag = await tx.tag.findFirst({ where: { id: tagId, organizationId } })
    if (!tag) return

    const existing = await tx.contactTag.findUnique({
      where: { contactId_tagId: { contactId: capture.contactId, tagId: tag.id } },
    })

    if (!existing) {
      await tx.contactTag.create({
        data: {
          contactId: capture.contactId,
          tagId: tag.id,
          originExecutionId: capture.executionId,
          originAutomationId: capture.automationId,
        },
      })
    }
  }
}
