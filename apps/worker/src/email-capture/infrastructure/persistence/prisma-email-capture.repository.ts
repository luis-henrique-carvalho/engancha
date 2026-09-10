import { Inject, Injectable } from '@nestjs/common'
import { normalizeEmail, normalizeTagName, type EmailCaptureJob } from '@engancha/contracts'
import { PrismaService } from '../../../platform/database/prisma.service'
import type { Prisma } from '../../../platform/database/client'
import type {
  EmailCaptureRepository,
  ProcessEmailCaptureResult,
} from '../../domain/ports/email-capture-repository.port'

@Injectable()
export class PrismaEmailCaptureRepository implements EmailCaptureRepository {
  constructor(@Inject(PrismaService) private readonly database: PrismaService) {}

  async claimAndProcess(job: EmailCaptureJob): Promise<ProcessEmailCaptureResult> {
    const { captureRequestId, organizationId, submittedEmail } = job
    const normalized = normalizeEmail(submittedEmail)

    return await this.database.client.$transaction(async (tx) => {
      // 1. Busca a captura
      const capture = await tx.emailCaptureRequest.findFirst({
        where: {
          id: captureRequestId,
          organizationId,
        },
        include: {
          contact: true,
          execution: true,
          conversation: true,
        },
      })

      if (!capture) {
        throw new Error(
          `Email capture request ${captureRequestId} not found for org ${organizationId}`,
        )
      }

      // Se já estiver COMPLETED, retorna resultado idempotente
      if (capture.status === 'COMPLETED') {
        const lead = await tx.lead.findUnique({
          where: {
            organizationId_contactId: {
              organizationId,
              contactId: capture.contactId,
            },
          },
        })

        return {
          captureId: capture.id,
          conversationId: capture.conversationId,
          contactId: capture.contactId,
          leadId: lead?.id,
          status: 'COMPLETED',
        }
      }

      // Se já estiver SUPERSEDED, não processa efeitos
      if (capture.status === 'SUPERSEDED') {
        return {
          captureId: capture.id,
          conversationId: capture.conversationId,
          contactId: capture.contactId,
          status: 'SUPERSEDED',
        }
      }

      // 2. Claim atômico: garante que apenas um worker processe esta captura
      const updated = await tx.emailCaptureRequest.updateMany({
        where: {
          id: captureRequestId,
          organizationId,
          status: 'PENDING',
        },
        data: {
          status: 'PROCESSING',
          claimedAt: new Date(),
          attempts: { increment: 1 },
        },
      })

      // Se não conseguiu atualizar para PROCESSING e não era da mesma claim, relê
      if (updated.count === 0 && capture.status !== 'PROCESSING') {
        const recheck = await tx.emailCaptureRequest.findUniqueOrThrow({
          where: { id: captureRequestId },
        })

        if (recheck.status === 'COMPLETED') {
          const lead = await tx.lead.findUnique({
            where: {
              organizationId_contactId: {
                organizationId,
                contactId: recheck.contactId,
              },
            },
          })

          return {
            captureId: recheck.id,
            conversationId: recheck.conversationId,
            contactId: recheck.contactId,
            leadId: lead?.id,
            status: 'COMPLETED',
          }
        }

        if (recheck.status === 'SUPERSEDED') {
          return {
            captureId: recheck.id,
            conversationId: recheck.conversationId,
            contactId: recheck.contactId,
            status: 'SUPERSEDED',
          }
        }
      }

      // 3. DEC-05: Verificação de conflito de identidade
      // Se já existir outro contato no mesmo workspace com o mesmo emailNormalized:
      const conflictingContact = await tx.contact.findFirst({
        where: {
          organizationId,
          emailNormalized: normalized,
          id: { not: capture.contactId },
        },
      })

      if (conflictingContact) {
        // Falha fechado sem mesclar pessoas, mover histórico ou criar lead
        await tx.emailCaptureRequest.update({
          where: { id: captureRequestId },
          data: {
            status: 'PENDING', // Permanece pending para que o usuário possa corrigir o endereço
            errorCode: 'IDENTITY_CONFLICT',
            errorMessage:
              'O e-mail informado já está associado a outro contato neste espaço de trabalho.',
          },
        })

        return {
          captureId: capture.id,
          conversationId: capture.conversationId,
          contactId: capture.contactId,
          status: 'FAILED',
          errorCode: 'IDENTITY_CONFLICT',
          errorMessage:
            'O e-mail informado já está associado a outro contato neste espaço de trabalho.',
        }
      }

      // 4. Cria mensagem de resposta de entrada (INBOUND)
      const interactionAt = new Date()
      const responseMessage = await this.ensureInboundResponseMessage(
        tx,
        capture,
        organizationId,
        submittedEmail,
        interactionAt,
      )

      // 5. Enriquece o contato com email e emailNormalized
      await tx.contact.update({
        where: { id: capture.contactId },
        data: {
          email: submittedEmail,
          emailNormalized: normalized,
          lastInteractionAt: interactionAt,
        },
      })

      // 6. Atualiza conversation lastMessageAt
      await tx.conversation.update({
        where: { id: capture.conversationId },
        data: { lastMessageAt: interactionAt },
      })

      // 7. DEC-08: Criação ou preservação do primeiro lead (atribuição imutável)
      const lead = await this.findOrCreateFirstLead(tx, capture, organizationId, interactionAt)

      // 8. Aplica tag configurada na automação/revisão se houver ação APPLY_TAG
      await this.applyAutomationTagIfPresent(tx, capture, organizationId)

      // 9. Marca EmailCaptureRequest como COMPLETED
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
        status: 'PENDING', // mantem pending para recuperação/retry seguro
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
      contactId: string
      automationId: string | null
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
    if (!capture.automationRevisionId) {
      return
    }

    const tagAction = await tx.automationAction.findFirst({
      where: {
        revisionId: capture.automationRevisionId,
        type: 'APPLY_TAG',
      },
    })

    if (!tagAction || !tagAction.config || typeof tagAction.config !== 'object') {
      return
    }

    const config = tagAction.config as Record<string, unknown>
    let tagId = config.tagId as string | undefined

    if (!tagId && typeof config.name === 'string' && config.name.trim()) {
      const normalizedName = normalizeTagName(config.name)
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
              name: config.name.trim(),
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

      if (!tag) {
        return
      }

      const existing = await tx.contactTag.findUnique({
        where: {
          contactId_tagId: {
            contactId: capture.contactId,
            tagId: tag.id,
          },
        },
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
}
