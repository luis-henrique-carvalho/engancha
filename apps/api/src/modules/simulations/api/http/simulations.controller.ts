import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  Sse,
  UseGuards,
  type MessageEvent,
} from '@nestjs/common'
import type { Observable } from 'rxjs'
import { simulationCommentRequestSchema, type SimulationCommentRequest } from '@engancha/contracts'
import {
  AuthorizationContextGuard,
  type RequestWithAuthorization,
} from '../../../../platform/security/authorization-context'
import { ZodValidationPipe } from '../../../../platform/http/zod-validation.pipe'
import { SimulationsService } from '../../application/simulations.service'

@Controller('simulations')
@UseGuards(AuthorizationContextGuard)
export class SimulationsController {
  constructor(@Inject(SimulationsService) private readonly simulations: SimulationsService) {}

  @Post('comments')
  submit(
    @Body(new ZodValidationPipe(simulationCommentRequestSchema)) body: SimulationCommentRequest,
    @Req() request: RequestWithAuthorization,
  ) {
    return this.simulations.submit(request.authorizationContext!, body)
  }

  @Get('executions/:id')
  get(@Param('id') id: string, @Req() request: RequestWithAuthorization) {
    return this.simulations.get(request.authorizationContext!, id)
  }

  @Sse('executions/:id/events')
  stream(
    @Param('id') id: string,
    @Req() request: RequestWithAuthorization,
  ): Promise<Observable<MessageEvent>> {
    return this.simulations.stream(request.authorizationContext!, id)
  }

  @Post('executions/:id/retry')
  retry(@Param('id') id: string, @Req() request: RequestWithAuthorization) {
    return this.simulations.retry(request.authorizationContext!, id)
  }
}
