import { Controller, Get, Inject, Query, Req, UseGuards } from '@nestjs/common'
import { leadListQuerySchema, type LeadListQuery } from '@engancha/contracts'
import {
  AuthorizationContextGuard,
  type RequestWithAuthorization,
} from '../../../../platform/security/authorization-context'
import { ZodValidationPipe } from '../../../../platform/http/zod-validation.pipe'
import { ConversationsService } from '../../application/conversations.service'

@Controller('leads')
@UseGuards(AuthorizationContextGuard)
export class LeadsController {
  constructor(
    @Inject(ConversationsService)
    private readonly conversationsService: ConversationsService,
  ) {}

  @Get()
  async listLeads(
    @Req() request: RequestWithAuthorization,
    @Query(new ZodValidationPipe(leadListQuerySchema))
    query: LeadListQuery,
  ) {
    return this.conversationsService.listLeads(request.authorizationContext!, query)
  }
}
