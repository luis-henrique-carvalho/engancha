import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AppController } from './app.controller'
import { apiEnvSchema, validateApiEnvironment } from './platform/config/runtime-env'
import { PlatformModule } from './platform/platform.module'
import { AuthModule } from '@thallesp/nestjs-better-auth'
import { auth } from './integrations/auth/auth'
import { DatabaseModule } from './platform/database/database.module'
import { HealthModule } from './modules/health/health.module'
import { InfrastructureModule } from './platform/health/infrastructure.module'
import { VerificationModule } from './modules/verification/verification.module'
import { WorkspacesModule } from './modules/workspaces/workspaces.module'
import { DevelopmentEmailOutboxModule } from './modules/development-email-outbox/development-email-outbox.module'
import { AutomationsModule } from './modules/automations/automations.module'
import { SimulationsModule } from './modules/simulations/simulations.module'

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
    PlatformModule,
    InfrastructureModule,
    HealthModule,
    VerificationModule,
    WorkspacesModule,
    DevelopmentEmailOutboxModule,
    AutomationsModule,
    SimulationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
