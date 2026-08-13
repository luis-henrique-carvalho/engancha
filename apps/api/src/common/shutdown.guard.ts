import { CanActivate, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { RuntimeLifecycleService } from './runtime-lifecycle.service'

@Injectable()
export class ShutdownGuard implements CanActivate {
  constructor(private readonly lifecycle: RuntimeLifecycleService) {}

  canActivate(): boolean {
    if (this.lifecycle.isShuttingDown) {
      throw new ServiceUnavailableException('Service is shutting down')
    }

    return true
  }
}
