import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import {
  createAutomationRequestSchema,
  paginationRequestSchema,
  patchAutomationRequestSchema,
  type CreateAutomationRequest,
  type PaginationRequest,
  type PatchAutomationRequest,
} from '@engancha/contracts'
import {
  AuthorizationContextGuard,
  type RequestWithAuthorization,
} from '../../authorization/authorization-context'
import { ZodValidationPipe } from '../../common/zod-validation.pipe'
import { AutomationsService } from '../services/automations.service'

@Controller('automations')
@UseGuards(AuthorizationContextGuard)
export class AutomationsController {
  constructor(private readonly automations: AutomationsService) {}
  @Get() list(
    @Query(new ZodValidationPipe(paginationRequestSchema)) query: PaginationRequest,
    @Req() request: RequestWithAuthorization,
  ) {
    return this.automations.list(request.authorizationContext!, query)
  }
  @Post() create(
    @Body(new ZodValidationPipe(createAutomationRequestSchema)) body: CreateAutomationRequest,
    @Req() request: RequestWithAuthorization,
  ) {
    return this.automations.create(request.authorizationContext!, body)
  }
  @Get(':id') get(@Param('id') id: string, @Req() request: RequestWithAuthorization) {
    return this.automations.get(request.authorizationContext!, id)
  }
  @Patch(':id') patch(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(patchAutomationRequestSchema)) body: PatchAutomationRequest,
    @Req() request: RequestWithAuthorization,
  ) {
    return this.automations.patch(request.authorizationContext!, id, body)
  }
  @Post(':id/publish') publish(@Param('id') id: string, @Req() request: RequestWithAuthorization) {
    return this.automations.publish(request.authorizationContext!, id)
  }
  @Post(':id/pause') pause(@Param('id') id: string, @Req() request: RequestWithAuthorization) {
    return this.automations.pause(request.authorizationContext!, id)
  }
}
