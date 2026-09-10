import { Inject, Injectable } from '@nestjs/common'
import type { Prisma } from '../../../platform/database/client'
import {
  deterministicCommentMessageExternalId,
  normalizeContactExternalUserId,
  normalizeContactUsername,
  type AutomationSnapshot,
  type ContentMode,
  type ContentProvider,
} from '@engancha/contracts'
import { PrismaService } from '../../../platform/database/prisma.service'
import type {
  AutomationExecutionRepository,
  CandidateAutomation,
  ClaimedExecution,
  SaveExecutionCompletedResult,
} from '../../domain/ports/automation-execution-repository.port'

@Injectable()
export class PrismaAutomationExecutionRepository implements AutomationExecutionRepository {
  constructor(@Inject(PrismaService) private readonly database: PrismaService) {}

  async claimExecution(
    executionId: string,
    organizationId: string,
  ): Promise<ClaimedExecution | null> {
    const updated = await this.database.client.automationExecution.updateMany({
      where: {
        id: executionId,
        organizationId,
        status: 'PENDING',
      },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        attempts: { increment: 1 },
        stateVersion: { increment: 1 },
      },
    })

    if (updated.count === 0) {
      return null
    }

    const execution = await this.database.client.automationExecution.findUniqueOrThrow({
      where: { id: executionId },
      select: {
        id: true,
        organizationId: true,
        contentId: true,
        provider: true,
        mode: true,
        channelConnectionId: true,
        inputText: true,
        inputAuthor: true,
        commentId: true,
        originAutomationId: true,
        automationId: true,
        automationRevisionId: true,
        automationSnapshot: true,
        contactId: true,
        conversationId: true,
        status: true,
        attempts: true,
        stateVersion: true,
        createdAt: true,
      },
    })

    return execution as ClaimedExecution
  }

  async findActiveCandidateAutomations(
    organizationId: string,
    contentId: string,
    provider: string,
    mode: string,
  ): Promise<CandidateAutomation[]> {
    const automations = await this.database.client.automation.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        currentPublishedRevisionId: { not: null },
        currentPublishedRevision: {
          target: {
            contentId,
            content: {
              provider: provider as never,
              mode: mode as never,
            },
          },
        },
      },
      include: {
        currentPublishedRevision: {
          include: {
            target: true,
            trigger: true,
            actions: { orderBy: { position: 'asc' } },
          },
        },
      },
    })

    return automations
      .filter(
        (
          auto,
        ): auto is typeof auto & {
          currentPublishedRevision: NonNullable<typeof auto.currentPublishedRevision> & {
            target: NonNullable<NonNullable<typeof auto.currentPublishedRevision>['target']>
            trigger: NonNullable<NonNullable<typeof auto.currentPublishedRevision>['trigger']>
          }
        } =>
          auto.currentPublishedRevision !== null &&
          auto.currentPublishedRevision.target !== null &&
          auto.currentPublishedRevision.trigger !== null,
      )
      .map((auto) => ({
        id: auto.id,
        organizationId: auto.organizationId,
        status: auto.status,
        currentPublishedRevision: {
          id: auto.currentPublishedRevision.id,
          version: auto.currentPublishedRevision.version,
          target: {
            id: auto.currentPublishedRevision.target.id,
            contentId: auto.currentPublishedRevision.target.contentId,
          },
          trigger: {
            id: auto.currentPublishedRevision.trigger.id,
            type: auto.currentPublishedRevision.trigger.type,
            keyword: auto.currentPublishedRevision.trigger.keyword,
            keywordNormalized: auto.currentPublishedRevision.trigger.keywordNormalized,
          },
          actions: auto.currentPublishedRevision.actions.map((action) => ({
            id: action.id,
            position: action.position,
            type: action.type,
            config: action.config as Record<string, unknown>,
          })),
        },
      }))
  }

  async saveMatchSnapshot(params: {
    executionId: string
    organizationId: string
    automationId: string
    revisionId: string
    snapshot: AutomationSnapshot
  }): Promise<void> {
    await this.database.client.automationExecution.update({
      where: { id: params.executionId },
      data: {
        automationId: params.automationId,
        automationRevisionId: params.revisionId,
        automationSnapshot: params.snapshot as never,
        matched: true,
        stateVersion: { increment: 1 },
      },
    })
  }

  async saveExecutionCompleted(params: {
    executionId: string
    organizationId: string
    automationId: string
    revisionId: string
    snapshot: AutomationSnapshot
    outputs: Array<{
      key: string
      position: number
      type: 'PUBLIC_REPLY' | 'PRIVATE_REPLY' | 'LINK_DELIVERY' | 'EMAIL_CAPTURE_REQUEST'
      payload: Record<string, unknown>
    }>
  }): Promise<SaveExecutionCompletedResult> {
    return await this.database.client.$transaction(async (tx) => {
      const execution = await tx.automationExecution.findUniqueOrThrow({
        where: { id: params.executionId },
        select: {
          id: true,
          organizationId: true,
          provider: true,
          mode: true,
          channelConnectionId: true,
          inputAuthor: true,
          inputText: true,
          commentId: true,
          createdAt: true,
          contactId: true,
          conversationId: true,
        },
      })

      const interactionAt = execution.createdAt ?? new Date()
      const contact = await this.resolveOrCreateContact(tx, execution, interactionAt)
      const conversation = await this.resolveOrCreateConversation(
        tx,
        execution,
        contact.id,
        interactionAt,
      )

      await this.recordInboundCommentMessage(tx, execution, conversation.id, interactionAt)

      await tx.automationExecution.update({
        where: { id: params.executionId },
        data: {
          automationId: params.automationId,
          automationRevisionId: params.revisionId,
          automationSnapshot: params.snapshot as never,
          matched: true,
          status: 'COMPLETED',
          contactId: contact.id,
          conversationId: conversation.id,
          completedAt: new Date(),
          stateVersion: { increment: 1 },
        },
      })

      await this.upsertExecutionOutputs(tx, params.executionId, params.outputs)

      return { contactId: contact.id, conversationId: conversation.id }
    })
  }

  private async resolveOrCreateContact(
    tx: Prisma.TransactionClient,
    execution: {
      organizationId: string
      provider: ContentProvider
      mode: ContentMode
      channelConnectionId: string | null
      inputAuthor: string
    },
    interactionAt: Date,
  ) {
    const externalUserId = normalizeContactExternalUserId(execution.inputAuthor)
    const username = normalizeContactUsername(execution.inputAuthor)
    const name = username

    let contact = await tx.contact.findFirst({
      where: {
        organizationId: execution.organizationId,
        provider: execution.provider,
        mode: execution.mode,
        channelConnectionId: execution.channelConnectionId ?? null,
        externalUserId,
      },
    })

    if (!contact) {
      try {
        contact = await tx.contact.create({
          data: {
            organizationId: execution.organizationId,
            provider: execution.provider,
            mode: execution.mode,
            channelConnectionId: execution.channelConnectionId ?? null,
            externalUserId,
            username,
            name,
            lastInteractionAt: interactionAt,
          },
        })
      } catch {
        contact = await tx.contact.findFirstOrThrow({
          where: {
            organizationId: execution.organizationId,
            provider: execution.provider,
            mode: execution.mode,
            channelConnectionId: execution.channelConnectionId ?? null,
            externalUserId,
          },
        })
      }
    } else {
      await tx.contact.update({
        where: { id: contact.id },
        data: {
          lastInteractionAt: interactionAt,
          username: contact.username ?? username,
          name: contact.name ?? name,
        },
      })
    }

    return contact
  }

  private async resolveOrCreateConversation(
    tx: Prisma.TransactionClient,
    execution: {
      organizationId: string
      provider: ContentProvider
      mode: ContentMode
      channelConnectionId: string | null
    },
    contactId: string,
    interactionAt: Date,
  ) {
    let conversation = await tx.conversation.findFirst({
      where: {
        organizationId: execution.organizationId,
        contactId,
        provider: execution.provider,
        mode: execution.mode,
        channelConnectionId: execution.channelConnectionId ?? null,
      },
    })

    if (!conversation) {
      try {
        conversation = await tx.conversation.create({
          data: {
            organizationId: execution.organizationId,
            contactId,
            provider: execution.provider,
            mode: execution.mode,
            channelConnectionId: execution.channelConnectionId ?? null,
            status: 'OPEN',
            lastMessageAt: interactionAt,
          },
        })
      } catch {
        conversation = await tx.conversation.findFirstOrThrow({
          where: {
            organizationId: execution.organizationId,
            contactId,
            provider: execution.provider,
            mode: execution.mode,
            channelConnectionId: execution.channelConnectionId ?? null,
          },
        })
      }
    } else {
      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: interactionAt,
        },
      })
    }

    return conversation
  }

  private async recordInboundCommentMessage(
    tx: Prisma.TransactionClient,
    execution: {
      id: string
      organizationId: string
      provider: ContentProvider
      mode: ContentMode
      channelConnectionId: string | null
      inputText: string
      inputAuthor: string
      commentId: string | null
    },
    conversationId: string,
    interactionAt: Date,
  ) {
    const commentExternalId = deterministicCommentMessageExternalId(execution.id)
    const existingMessage = await tx.message.findFirst({
      where: {
        conversationId,
        externalId: commentExternalId,
      },
    })

    if (existingMessage) return

    try {
      await tx.message.create({
        data: {
          organizationId: execution.organizationId,
          conversationId,
          executionId: execution.id,
          channelConnectionId: execution.channelConnectionId ?? null,
          direction: 'INBOUND',
          type: 'COMMENT',
          provider: execution.provider,
          mode: execution.mode,
          externalId: commentExternalId,
          text: execution.inputText,
          payload: {
            author: execution.inputAuthor,
            commentId: execution.commentId,
            simulated: execution.mode === 'SIMULATED',
          },
          status: 'RECEIVED',
          sentAt: interactionAt,
        },
      })
    } catch {
      // Já existe por concorrência ou reexecução
    }
  }

  private async upsertExecutionOutputs(
    tx: Prisma.TransactionClient,
    executionId: string,
    outputs: Array<{
      key: string
      position: number
      type: 'PUBLIC_REPLY' | 'PRIVATE_REPLY' | 'LINK_DELIVERY' | 'EMAIL_CAPTURE_REQUEST'
      payload: Record<string, unknown>
    }>,
  ) {
    for (const output of outputs) {
      await tx.automationExecutionOutput.upsert({
        where: {
          executionId_key: {
            executionId,
            key: output.key,
          },
        },
        create: {
          executionId,
          key: output.key,
          position: output.position,
          type: output.type,
          payload: output.payload as never,
        },
        update: {
          position: output.position,
          type: output.type,
          payload: output.payload as never,
        },
      })
    }
  }

  async recordAttemptFailure(params: {
    executionId: string
    organizationId: string
    attemptsMade: number
  }): Promise<void> {
    await this.database.client.automationExecution.updateMany({
      where: {
        id: params.executionId,
        organizationId: params.organizationId,
        status: 'PROCESSING',
      },
      data: {
        status: 'PENDING',
        stateVersion: { increment: 1 },
      },
    })
  }

  async markIgnored(params: {
    executionId: string
    organizationId: string
    reason: string
  }): Promise<void> {
    await this.database.client.automationExecution.update({
      where: { id: params.executionId },
      data: {
        status: 'IGNORED',
        matched: false,
        completedAt: new Date(),
        errorMessage: params.reason,
        stateVersion: { increment: 1 },
      },
    })
  }

  async markFailed(params: {
    executionId: string
    organizationId: string
    errorCode: string
    errorMessage: string
    matched?: boolean
  }): Promise<void> {
    await this.database.client.automationExecution.update({
      where: { id: params.executionId },
      data: {
        status: 'FAILED',
        ...(params.matched !== undefined ? { matched: params.matched } : {}),
        completedAt: new Date(),
        errorCode: params.errorCode,
        errorMessage: params.errorMessage,
        stateVersion: { increment: 1 },
      },
    })
  }
}
