import { SetMetadata } from '@nestjs/common'

export const SKIP_SHUTDOWN_GUARD = 'skipShutdownGuard'

export const SkipShutdownGuard = (): MethodDecorator & ClassDecorator =>
  SetMetadata(SKIP_SHUTDOWN_GUARD, true)
