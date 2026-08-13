import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { apiEnvSchema, validateApiEnvironment } from './config/runtime-env'
import { RuntimeLifecycleService } from './common/runtime-lifecycle.service'
import { ShutdownGuard } from './common/shutdown.guard'
import { StructuredLogger } from './common/structured-logger'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: apiEnvSchema,
      validate: validateApiEnvironment,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
  ],
  controllers: [AppController],
  providers: [
    { provide: StructuredLogger, useFactory: () => new StructuredLogger('api') },
    {
      provide: RuntimeLifecycleService,
      useFactory: (logger: StructuredLogger) => new RuntimeLifecycleService(logger),
      inject: [StructuredLogger],
    },
    {
      provide: ShutdownGuard,
      useFactory: (lifecycle: RuntimeLifecycleService) => new ShutdownGuard(lifecycle),
      inject: [RuntimeLifecycleService],
    },
  ],
  exports: [RuntimeLifecycleService],
})
export class AppModule {}
