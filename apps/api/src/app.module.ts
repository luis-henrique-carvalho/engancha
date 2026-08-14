import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AppController } from './app.controller'
import { apiEnvSchema, validateApiEnvironment } from './config/runtime-env'
import { CoreModule } from './common/core.module'
import { AuthModule } from '@thallesp/nestjs-better-auth'
import { auth } from './auth/auth'
import { DatabaseModule } from './database/database.module'
import { HealthModule } from './health/health.module'
import { InfrastructureModule } from './infrastructure/infrastructure.module'
import { VerificationModule } from './verification/verification.module'
import { WorkspacesModule } from './workspaces/workspaces.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      validationSchema: apiEnvSchema,
      validate: validateApiEnvironment,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    DatabaseModule,
    AuthModule.forRoot({ auth, isGlobal: true }),
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
    WorkspacesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
