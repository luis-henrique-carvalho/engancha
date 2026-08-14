import { Module } from '@nestjs/common'
import { CoreModule } from '../common/core.module'
import { InfrastructureModule } from '../infrastructure/infrastructure.module'
import { HealthController } from './health.controller'

@Module({
  imports: [CoreModule, InfrastructureModule],
  controllers: [HealthController],
})
export class HealthModule {}
