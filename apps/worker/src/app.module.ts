import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { workerEnvSchema, validateWorkerEnvironment } from './config/runtime-env'
import { RuntimeLifecycleService } from './common/runtime-lifecycle.service'
import { StructuredLogger } from './common/structured-logger'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: workerEnvSchema,
      validate: validateWorkerEnvironment,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
  ],
  providers: [
    { provide: StructuredLogger, useFactory: () => new StructuredLogger('worker') },
    {
      provide: RuntimeLifecycleService,
      useFactory: (logger: StructuredLogger) => new RuntimeLifecycleService(logger),
      inject: [StructuredLogger],
    },
  ],
  exports: [RuntimeLifecycleService],
})
export class AppModule {}
