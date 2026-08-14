import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import type { WorkerRuntimeConfig } from './config/runtime-env'
import { CoreModule } from './common/core.module'
import { WorkerConfigModule } from './config/worker-config.module'
import { InfrastructureModule } from './infrastructure/infrastructure.module'
import { VerificationModule } from './verification/verification.module'
import { EmailModule } from './email/email.module'

@Module({
  imports: [
    WorkerConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<WorkerRuntimeConfig, true>) => ({
        connection: { url: config.get('redisUrl', { infer: true }) },
      }),
    }),
    CoreModule,
    InfrastructureModule,
    VerificationModule,
    EmailModule,
  ],
})
export class AppModule {}
