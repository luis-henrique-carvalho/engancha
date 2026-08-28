import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import {
  automationListRequestSchema,
  createAutomationRequestSchema,
  patchAutomationRequestSchema,
  type AutomationListRequest,
  type CreateAutomationRequest,
  type PatchAutomationRequest,
} from '@engancha/contracts'
import {
  AuthorizationContextGuard,
  type RequestWithAuthorization,
} from '../../../../platform/security/authorization-context'
import { ZodValidationPipe } from '../../../../platform/http/zod-validation.pipe'
import { AutomationsService } from '../../application/automations.service'

@Controller('automations')
@UseGuards(AuthorizationContextGuard)
export class AutomationsController {
  constructor(@Inject(AutomationsService) private readonly automations: AutomationsService) {}

  @Get() list(
    @Query(new ZodValidationPipe(automationListRequestSchema)) query: AutomationListRequest,
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
