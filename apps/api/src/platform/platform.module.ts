import { APP_FILTER, APP_GUARD, Reflector } from '@nestjs/core'
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { GlobalExceptionFilter } from './http/global-exception.filter'
import { RequestContextMiddleware } from './http/request-context.middleware'
import { RuntimeLifecycleService } from './runtime/runtime-lifecycle.service'
import { ShutdownGuard } from './runtime/shutdown.guard'
import { StructuredLogger } from './runtime/structured-logger'

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
export class PlatformModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes({ path: '*path', method: RequestMethod.ALL })
  }
}
