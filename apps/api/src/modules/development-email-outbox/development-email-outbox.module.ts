import { Module } from '@nestjs/common'
import { DevelopmentEmailOutboxController } from './api/http/development-email-outbox.controller'
import { DevelopmentEmailOutboxService } from './application/development-email-outbox.service'

@Module({
  controllers: [DevelopmentEmailOutboxController],
  providers: [DevelopmentEmailOutboxService],
})
export class DevelopmentEmailOutboxModule {}
