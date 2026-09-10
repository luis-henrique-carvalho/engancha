import { Body, Controller, Inject, Param, Post, Req, UseGuards } from '@nestjs/common'
import {
  emailCaptureResponseSubmissionSchema,
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
