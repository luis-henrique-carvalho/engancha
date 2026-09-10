import { Body, Controller, Get, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common'
import {
  conversationListQuerySchema,
  emailCaptureResponseSubmissionSchema,
  type ConversationListQuery,
  type EmailCaptureResponseSubmission,
} from '@engancha/contracts'
import {
  AuthorizationContextGuard,
  type RequestWithAuthorization,
} from '../../../../platform/security/authorization-context'
import { ZodValidationPipe } from '../../../../platform/http/zod-validation.pipe'
import { ConversationsService } from '../../application/conversations.service'

@Controller('conversations')
@UseGuards(AuthorizationContextGuard)
export class ConversationsController {
  constructor(
    @Inject(ConversationsService)
    private readonly conversationsService: ConversationsService,
  ) {}

  @Get()
  async listConversations(
    @Req() request: RequestWithAuthorization,
    @Query(new ZodValidationPipe(conversationListQuerySchema))
    query: ConversationListQuery,
  ) {
    return this.conversationsService.listConversations(request.authorizationContext!, query)
  }

  @Get(':id')
  async getConversationById(
    @Param('id') conversationId: string,
    @Req() request: RequestWithAuthorization,
  ) {
    return this.conversationsService.getConversationById(
      request.authorizationContext!,
      conversationId,
    )
  }

  @Post(':id/email-captures/:captureId/responses')
  async submitEmailCaptureResponse(
    @Param('id') conversationId: string,
    @Param('captureId') captureId: string,
    @Body(new ZodValidationPipe(emailCaptureResponseSubmissionSchema))
    body: EmailCaptureResponseSubmission,
    @Req() request: RequestWithAuthorization,
  ) {
    return this.conversationsService.submitEmailCaptureResponse(
      request.authorizationContext!,
      conversationId,
      captureId,
      body,
    )
  }
}
