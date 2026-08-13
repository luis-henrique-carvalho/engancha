import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { workerEnvSchema, validateWorkerEnvironment } from './config/runtime-env'
import { RuntimeLifecycleService } from './common/runtime-lifecycle.service'
import { StructuredLogger } from './common/structured-logger'
import { RedisReadinessService, REDIS_PROBE } from './infrastructure/redis-readiness.service'
import { createRedisProbe } from './infrastructure/redis-probe'

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
    {
      provide: REDIS_PROBE,
      useFactory: (config: ConfigService) =>
        createRedisProbe(config.getOrThrow<string>('redisUrl')),
      inject: [ConfigService],
    },
    {
      provide: RedisReadinessService,
      useFactory: (redisProbe: ReturnType<typeof createRedisProbe>) =>
        new RedisReadinessService(redisProbe),
      inject: [REDIS_PROBE],
    },
  ],
  exports: [RuntimeLifecycleService],
})
export class AppModule {}
