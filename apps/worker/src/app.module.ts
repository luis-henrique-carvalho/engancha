import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { workerEnvSchema, validateWorkerEnvironment } from './config/runtime-env'
import { RuntimeLifecycleService } from './common/runtime-lifecycle.service'
import { StructuredLogger } from './common/structured-logger'
import { RedisReadinessService, REDIS_PROBE } from './infrastructure/redis-readiness.service'
import { createRedisProbe } from './infrastructure/redis-probe'
import { queueNames } from '@engancha/contracts'
import { VerificationProcessor } from './verification/verification.worker'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: workerEnvSchema,
      validate: validateWorkerEnvironment,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('redisUrl') },
      }),
    }),
    BullModule.registerQueue({ name: queueNames.verification }),
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
    VerificationProcessor,
  ],
  exports: [RuntimeLifecycleService],
})
export class AppModule {}
