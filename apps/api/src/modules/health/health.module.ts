import { Module } from '@nestjs/common'
import { PlatformModule } from '../../platform/platform.module'
import { InfrastructureModule } from '../../platform/health/infrastructure.module'
import { HealthController } from './api/http/health.controller'

@Module({
  imports: [PlatformModule, InfrastructureModule],
  controllers: [HealthController],
})
export class HealthModule {}
