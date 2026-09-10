import { Inject, Injectable } from '@nestjs/common'
import type { Prisma } from '../../../platform/database/client'
import {
  deterministicCommentMessageExternalId,
  deterministicOutputMessageExternalId,
  normalizeContactExternalUserId,
  normalizeContactUsername,
  normalizeTagName,
  type AutomationSnapshot,
  type ContentMode,
  type ContentProvider,
  type MessageType,
} from '@engancha/contracts'
import { PrismaService } from '../../../platform/database/prisma.service'
import type {
  AutomationExecutionOutputDraft,
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
    outputs: AutomationExecutionOutputDraft[]
  }): Promise<SaveExecutionCompletedResult> {
    const execution = await this.database.client.automationExecution.findUniqueOrThrow({
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
    const contact = await this.resolveOrCreateContact(
      this.database.client,
      execution,
      interactionAt,
    )
    const conversation = await this.resolveOrCreateConversation(
      this.database.client,
      execution,
      contact.id,
      interactionAt,
    )

    return await this.database.client.$transaction(async (tx) => {
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

      await this.projectOutputsToHistory(
        tx,
        execution,
        contact.id,
        conversation.id,
        params,
        interactionAt,
      )

      return { contactId: contact.id, conversationId: conversation.id }
    })
  }

  private async resolveOrCreateContact(
    tx: any,
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
    tx: any,
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
          position: 0,
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
    outputs: AutomationExecutionOutputDraft[],
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

  private async projectOutputsToHistory(
    tx: Prisma.TransactionClient,
    execution: {
      id: string
      organizationId: string
      provider: ContentProvider
      mode: ContentMode
      channelConnectionId: string | null
    },
    contactId: string,
    conversationId: string,
    params: {
      executionId: string
      automationId: string
      revisionId: string
      snapshot: AutomationSnapshot
      outputs: AutomationExecutionOutputDraft[]
    },
    interactionAt: Date,
  ) {
    const sortedOutputs = params.outputs.slice().sort((a, b) => a.position - b.position)

    for (const output of sortedOutputs) {
      if (output.type === 'TAG_APPLICATION') {
        await this.applyTagToContact(
          tx,
          execution.organizationId,
          contactId,
          output.payload,
          execution.id,
          params.automationId,
        )
        continue
      }

      const externalId = deterministicOutputMessageExternalId(execution.id, output.key)
      let messageType: MessageType
      let text: string | null = null

      switch (output.type) {
        case 'PUBLIC_REPLY':
          messageType = 'PUBLIC_REPLY'
          text = (output.payload.text as string) ?? null
          break
        case 'PRIVATE_REPLY':
          messageType = 'DIRECT_MESSAGE'
          text = (output.payload.text as string) ?? null
          break
        case 'LINK_DELIVERY':
          messageType = 'DIRECT_MESSAGE_WITH_LINK'
          text = `${(output.payload.label as string) || 'Abrir link'}: ${(output.payload.url as string) || ''}`
          break
        case 'EMAIL_CAPTURE_REQUEST':
          messageType = 'EMAIL_CAPTURE_REQUEST'
          text = (output.payload.prompt as string) ?? null
          break
        default:
          continue
      }

      const position = output.position + 1
      const sentAt = new Date(interactionAt.getTime() + position * 1000)

      let message = await tx.message.findFirst({
        where: {
          conversationId,
          externalId,
        },
      })

      if (!message) {
        try {
          message = await tx.message.create({
            data: {
              organizationId: execution.organizationId,
              conversationId,
              executionId: execution.id,
              channelConnectionId: execution.channelConnectionId ?? null,
              direction: 'OUTBOUND',
              type: messageType,
              provider: execution.provider,
              mode: execution.mode,
              externalId,
              text,
              position,
              payload: {
                ...output.payload,
                position: output.position,
                outputKey: output.key,
                outputType: output.type,
              },
              status: 'SENT',
              sentAt,
            },
          })
        } catch {
          message = await tx.message.findFirstOrThrow({
            where: {
              conversationId,
              externalId,
            },
          })
        }
      }

      if (output.type === 'EMAIL_CAPTURE_REQUEST') {
        const capture = await tx.emailCaptureRequest.findUnique({
          where: { executionId: execution.id },
        })

        if (!capture) {
          // Supersede any pending capture request in this conversation
          await tx.emailCaptureRequest.updateMany({
            where: {
              conversationId,
              status: 'PENDING',
            },
            data: {
              status: 'SUPERSEDED',
            },
          })

          try {
            await tx.emailCaptureRequest.create({
              data: {
                organizationId: execution.organizationId,
                conversationId,
                contactId,
                automationId: params.automationId,
                automationRevisionId: params.revisionId,
                executionId: execution.id,
                messageId: message.id,
                status: 'PENDING',
              },
            })
          } catch {
            // Reentry / race
          }
        }
      }
    }

    const lastOutput = sortedOutputs.filter((o) => o.type !== 'TAG_APPLICATION').at(-1)
    if (lastOutput) {
      const lastSentAt = new Date(interactionAt.getTime() + (lastOutput.position + 1) * 1000)
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: lastSentAt },
      })
    }
  }

  private async applyTagToContact(
    tx: Prisma.TransactionClient,
    organizationId: string,
    contactId: string,
    payload: Record<string, unknown>,
    originExecutionId?: string,
    originAutomationId?: string,
  ) {
    let tagId = payload.tagId as string | undefined

    if (!tagId && typeof payload.name === 'string' && payload.name.trim()) {
      const normalizedName = normalizeTagName(payload.name)
      let tag = await tx.tag.findUnique({
        where: {
          organizationId_normalizedName: {
            organizationId,
            normalizedName,
          },
        },
      })

      if (!tag) {
        try {
          tag = await tx.tag.create({
            data: {
              organizationId,
              name: payload.name.trim(),
              normalizedName,
            },
          })
        } catch {
          tag = await tx.tag.findUniqueOrThrow({
            where: {
              organizationId_normalizedName: {
                organizationId,
                normalizedName,
              },
            },
          })
        }
      }
      tagId = tag.id
    }

    if (tagId) {
      const tag = await tx.tag.findFirst({
        where: { id: tagId, organizationId },
      })

      if (tag) {
        const existing = await tx.contactTag.findUnique({
          where: {
            contactId_tagId: {
              contactId,
              tagId: tag.id,
            },
          },
        })

        if (!existing) {
          await tx.contactTag.create({
            data: {
              contactId,
              tagId: tag.id,
              originExecutionId,
              originAutomationId,
            },
          })
        }
      }
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
