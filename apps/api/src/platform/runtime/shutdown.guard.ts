import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RuntimeLifecycleService } from './runtime-lifecycle.service'
import { SKIP_SHUTDOWN_GUARD } from './skip-shutdown-guard.decorator'

@Injectable()
export class ShutdownGuard implements CanActivate {
  constructor(
    private readonly lifecycle: RuntimeLifecycleService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const skipShutdownGuard = this.reflector.getAllAndOverride<boolean>(SKIP_SHUTDOWN_GUARD, [
      context.getHandler(),
      context.getClass(),
    ])
    if (skipShutdownGuard) return true

    if (this.lifecycle.isShuttingDown) {
      throw new ServiceUnavailableException('Service is shutting down')
    }

    return true
  }
}
