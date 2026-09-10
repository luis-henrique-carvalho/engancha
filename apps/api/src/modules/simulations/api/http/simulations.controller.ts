import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
  type MessageEvent,
} from '@nestjs/common'
import type { Observable } from 'rxjs'
import { SkipThrottle } from '@nestjs/throttler'
import {
  simulationCommentRequestSchema,
  simulationExecutionListQuerySchema,
  type SimulationCommentRequest,
  type SimulationExecutionListQuery,
} from '@engancha/contracts'
import {
  AuthorizationContextGuard,
  type RequestWithAuthorization,
} from '../../../../platform/security/authorization-context'
import { ZodValidationPipe } from '../../../../platform/http/zod-validation.pipe'
import { SimulationsService } from '../../application/simulations.service'
import {
  SIMULATION_CREATE_THROTTLER,
  SIMULATION_READ_THROTTLER,
  SIMULATION_RETRY_THROTTLER,
  SimulationRateLimitGuard,
} from './simulation-rate-limit.guard'

@Controller('simulations')
@UseGuards(AuthorizationContextGuard)
export class SimulationsController {
  constructor(@Inject(SimulationsService) private readonly simulations: SimulationsService) {}

  @SkipThrottle({
    [SIMULATION_RETRY_THROTTLER]: true,
    [SIMULATION_READ_THROTTLER]: true,
  })
  @UseGuards(SimulationRateLimitGuard)
  @Post('comments')
  submit(
    @Body(new ZodValidationPipe(simulationCommentRequestSchema)) body: SimulationCommentRequest,
    @Req() request: RequestWithAuthorization,
  ) {
    return this.simulations.submit(request.authorizationContext!, body)
  }

  @SkipThrottle({
    [SIMULATION_CREATE_THROTTLER]: true,
    [SIMULATION_RETRY_THROTTLER]: true,
  })
  @UseGuards(SimulationRateLimitGuard)
  @Get('executions')
  list(
    @Query(new ZodValidationPipe(simulationExecutionListQuerySchema))
    query: SimulationExecutionListQuery,
    @Req() request: RequestWithAuthorization,
  ) {
    return this.simulations.list(request.authorizationContext!, query)
  }

  @SkipThrottle({
    [SIMULATION_CREATE_THROTTLER]: true,
    [SIMULATION_RETRY_THROTTLER]: true,
  })
  @UseGuards(SimulationRateLimitGuard)
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

  @SkipThrottle({
    [SIMULATION_CREATE_THROTTLER]: true,
    [SIMULATION_READ_THROTTLER]: true,
  })
  @UseGuards(SimulationRateLimitGuard)
  @Post('executions/:id/retry')
  retry(@Param('id') id: string, @Req() request: RequestWithAuthorization) {
    return this.simulations.retry(request.authorizationContext!, id)
  }
}
