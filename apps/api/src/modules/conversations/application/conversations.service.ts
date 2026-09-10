import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  EMAIL_CAPTURE_JOB,
  contractsVersion,
  type EmailCaptureResponseResult,
  type EmailCaptureResponseSubmission,
} from '@engancha/contracts'
import { PrismaService } from '../../../platform/database/prisma.service'
import type { AuthorizationContext } from '../../../platform/security/authorization-context'
import {
  EMAIL_CAPTURE_DISPATCHER,
  type EmailCaptureDispatcher,
} from '../domain/ports/email-capture-dispatcher.port'

@Injectable()
export class ConversationsService {
  constructor(
    @Inject(PrismaService) private readonly database: PrismaService,
    @Inject(EMAIL_CAPTURE_DISPATCHER)
    private readonly dispatcher: EmailCaptureDispatcher,
  ) {}

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
      include: {
        contact: true,
      },
    })

    if (!capture) {
      throw new NotFoundException('Captura de e-mail não encontrada ou acesso não autorizado')
    }

    // Se já estiver COMPLETED ou SUPERSEDED
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

    // Se já estiver associado à mesma idempotencyKey e estiver PROCESSING
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

    // Marca o idempotencyKey na captura para tracking de submissão estável
    await this.database.client.emailCaptureRequest.update({
      where: { id: capture.id },
      data: {
        idempotencyKey: submission.idempotencyKey,
      },
    })

    // Enfileira processamento assíncrono seguro
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
}
