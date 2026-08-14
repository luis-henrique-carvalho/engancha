import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AppController } from './app.controller'
import { apiEnvSchema, validateApiEnvironment } from './config/runtime-env'
import { CoreModule } from './common/core.module'
import { HealthModule } from './health/health.module'
import { InfrastructureModule } from './infrastructure/infrastructure.module'
import { VerificationModule } from './verification/verification.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
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
    CoreModule,
    InfrastructureModule,
    HealthModule,
    VerificationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
