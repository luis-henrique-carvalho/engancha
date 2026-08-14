import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AppController } from './app.controller'
import { apiEnvSchema, validateApiEnvironment } from './config/runtime-env'
import { RuntimeLifecycleService } from './common/runtime-lifecycle.service'
import { ShutdownGuard } from './common/shutdown.guard'
import { StructuredLogger } from './common/structured-logger'
import { HealthController } from './health/health.controller'
import {
  InfrastructureHealthService,
  POSTGRES_POOL,
  REDIS_PROBE,
} from './infrastructure/infrastructure-health.service'
import { createRedisProbe } from './infrastructure/redis-probe'
import { Pool } from 'pg'
import { VerificationController } from './verification/verification.controller'
import { VerificationService } from './verification/verification.service'
import { queueNames, verificationJobOptions } from '@engancha/contracts'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: apiEnvSchema,
      validate: validateApiEnvironment,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('redisUrl') },
      }),
    }),
    BullModule.registerQueue({
      name: queueNames.verification,
      defaultJobOptions: verificationJobOptions,
    }),
  ],
  controllers: [AppController, HealthController, VerificationController],
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
    {
      provide: POSTGRES_POOL,
      useFactory: (config: ConfigService) =>
        new Pool({
          connectionString: config.getOrThrow<string>('databaseUrl'),
          max: 1,
          connectionTimeoutMillis: 1000,
        }),
      inject: [ConfigService],
    },
    {
      provide: REDIS_PROBE,
      useFactory: (config: ConfigService) =>
        createRedisProbe(config.getOrThrow<string>('redisUrl')),
      inject: [ConfigService],
    },
    {
      provide: InfrastructureHealthService,
      useFactory: (postgres: Pool, redisProbe: ReturnType<typeof createRedisProbe>) =>
        new InfrastructureHealthService(postgres, redisProbe),
      inject: [POSTGRES_POOL, REDIS_PROBE],
    },
    VerificationService,
  ],
  exports: [RuntimeLifecycleService],
})
export class AppModule {}
