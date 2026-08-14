import { Module } from '@nestjs/common'
import { RuntimeLifecycleService } from './runtime-lifecycle.service'
import { StructuredLogger } from './structured-logger'
import { WORKER_LOGGER } from './worker-logger.token'

export { WORKER_LOGGER } from './worker-logger.token'

@Module({
  providers: [
    { provide: WORKER_LOGGER, useFactory: () => new StructuredLogger('worker') },
    RuntimeLifecycleService,
  ],
  exports: [RuntimeLifecycleService, WORKER_LOGGER],
})
export class CoreModule {}
