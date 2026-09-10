import { Controller, Get, Inject, Query, Req, UseGuards } from '@nestjs/common'
import { contactListQuerySchema, type ContactListQuery } from '@engancha/contracts'
import {
  AuthorizationContextGuard,
  type RequestWithAuthorization,
} from '../../../../platform/security/authorization-context'
import { ZodValidationPipe } from '../../../../platform/http/zod-validation.pipe'
import { ConversationsService } from '../../application/conversations.service'

@Controller('contacts')
@UseGuards(AuthorizationContextGuard)
export class ContactsController {
  constructor(
    @Inject(ConversationsService)
    private readonly conversationsService: ConversationsService,
  ) {}

  @Get()
  async listContacts(
    @Req() request: RequestWithAuthorization,
    @Query(new ZodValidationPipe(contactListQuerySchema))
    query: ContactListQuery,
  ) {
    return this.conversationsService.listContacts(request.authorizationContext!, query)
  }
}
