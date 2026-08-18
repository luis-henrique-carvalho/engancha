import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common'
import {
  createContentRequestSchema,
  paginationRequestSchema,
  type CreateContentRequest,
  type PaginationRequest,
} from '@engancha/contracts'
import {
  AuthorizationContextGuard,
  type RequestWithAuthorization,
} from '../../../../platform/security/authorization-context'
import { ZodValidationPipe } from '../../../../platform/http/zod-validation.pipe'
import { SimulatedContentsService } from '../../application/simulated-contents.service'

@Controller('simulated-contents')
@UseGuards(AuthorizationContextGuard)
export class SimulatedContentsController {
  constructor(private readonly contents: SimulatedContentsService) {}

  @Get() list(
    @Query(new ZodValidationPipe(paginationRequestSchema)) query: PaginationRequest,
    @Req() request: RequestWithAuthorization,
  ) {
    return this.contents.list(request.authorizationContext!, query)
  }

  @Post() create(
    @Body(new ZodValidationPipe(createContentRequestSchema)) body: CreateContentRequest,
    @Req() request: RequestWithAuthorization,
  ) {
    return this.contents.create(request.authorizationContext!, body)
  }
}
