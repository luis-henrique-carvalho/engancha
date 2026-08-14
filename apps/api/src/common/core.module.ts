import { APP_FILTER, APP_GUARD, Reflector } from '@nestjs/core'
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { GlobalExceptionFilter } from './global-exception.filter'
import { RequestContextMiddleware } from './request-context.middleware'
import { RuntimeLifecycleService } from './runtime-lifecycle.service'
import { ShutdownGuard } from './shutdown.guard'
import { StructuredLogger } from './structured-logger'

@Module({
  providers: [
    { provide: StructuredLogger, useFactory: () => new StructuredLogger('api') },
    {
      provide: RuntimeLifecycleService,
      useFactory: (logger: StructuredLogger) => new RuntimeLifecycleService(logger),
      inject: [StructuredLogger],
    },
    {
      provide: ShutdownGuard,
      useFactory: (lifecycle: RuntimeLifecycleService, reflector) =>
        new ShutdownGuard(lifecycle, reflector),
      inject: [RuntimeLifecycleService, Reflector],
    },
    {
      provide: GlobalExceptionFilter,
      useFactory: (logger: StructuredLogger) => new GlobalExceptionFilter(logger),
      inject: [StructuredLogger],
    },
    { provide: APP_GUARD, useExisting: ShutdownGuard },
    { provide: APP_FILTER, useExisting: GlobalExceptionFilter },
    RequestContextMiddleware,
  ],
  exports: [RuntimeLifecycleService, StructuredLogger],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes({ path: '*path', method: RequestMethod.ALL })
  }
}
