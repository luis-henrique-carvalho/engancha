import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common'
import {
  createSimulatedContentRequestSchema,
  paginationRequestSchema,
  type CreateSimulatedContentRequest,
  type PaginationRequest,
} from '@engancha/contracts'
import {
  AuthorizationContextGuard,
  type RequestWithAuthorization,
} from '../../authorization/authorization-context'
import { ZodValidationPipe } from '../../common/zod-validation.pipe'
import { SimulatedContentsService } from '../services/simulated-contents.service'
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
    @Body(new ZodValidationPipe(createSimulatedContentRequestSchema))
    body: CreateSimulatedContentRequest,
    @Req() request: RequestWithAuthorization,
  ) {
    return this.contents.create(request.authorizationContext!, body)
  }
}
