import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import {
  ThrottlerGuard,
  type ThrottlerLimitDetail,
  type ThrottlerModuleOptions,
} from '@nestjs/throttler'
import type { ConfigService } from '@nestjs/config'
import type { RequestWithAuthorization } from '../../../../platform/security/authorization-context'

export const SIMULATION_CREATE_THROTTLER = 'simulation-create'
export const SIMULATION_RETRY_THROTTLER = 'simulation-retry'
export const SIMULATION_READ_THROTTLER = 'simulation-read'

export const SIMULATION_RATE_LIMIT_ERROR_CODE = 'SIMULATION_RATE_LIMIT_EXCEEDED'
export const SIMULATION_RATE_LIMIT_ERROR_MESSAGE =
  'Too many simulation requests. Please try again later.'

export function createSimulationThrottlerOptions(config: ConfigService): ThrottlerModuleOptions {
  return {
    errorMessage: SIMULATION_RATE_LIMIT_ERROR_MESSAGE,
    throttlers: [
      {
        name: SIMULATION_CREATE_THROTTLER,
        limit: config.getOrThrow<number>('simulationCreateRateLimit'),
        ttl: config.getOrThrow<number>('simulationCreateRateLimitTtlMs'),
        blockDuration: config.getOrThrow<number>('simulationCreateRateLimitBlockDurationMs'),
      },
      {
        name: SIMULATION_RETRY_THROTTLER,
        limit: config.getOrThrow<number>('simulationRetryRateLimit'),
        ttl: config.getOrThrow<number>('simulationRetryRateLimitTtlMs'),
        blockDuration: config.getOrThrow<number>('simulationRetryRateLimitBlockDurationMs'),
      },
      {
        name: SIMULATION_READ_THROTTLER,
        limit: config.getOrThrow<number>('simulationReadRateLimit'),
        ttl: config.getOrThrow<number>('simulationReadRateLimitTtlMs'),
        blockDuration: config.getOrThrow<number>('simulationReadRateLimitBlockDurationMs'),
      },
    ],
  }
}

@Injectable()
export class SimulationRateLimitGuard extends ThrottlerGuard {
  protected async getTracker(request: Record<string, any>): Promise<string> {
    const authorizationContext = (request as RequestWithAuthorization).authorizationContext
    if (
      !authorizationContext?.userId ||
      !authorizationContext.organizationId ||
      !authorizationContext.membershipId
    ) {
      throw new UnauthorizedException('Authentication required')
    }

    return [
      'user',
      authorizationContext.userId,
      'organization',
      authorizationContext.organizationId,
      'membership',
      authorizationContext.membershipId,
    ].join(':')
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    details: ThrottlerLimitDetail,
  ): Promise<void> {
    context.switchToHttp().getResponse().header('Retry-After', details.timeToBlockExpire)

    throw new HttpException(
      {
        code: SIMULATION_RATE_LIMIT_ERROR_CODE,
        message: SIMULATION_RATE_LIMIT_ERROR_MESSAGE,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    )
  }
}
