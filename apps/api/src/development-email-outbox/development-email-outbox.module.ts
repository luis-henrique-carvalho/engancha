import { Module } from '@nestjs/common'
import { DevelopmentEmailOutboxController } from './development-email-outbox.controller'
import { DevelopmentEmailOutboxService } from './development-email-outbox.service'

@Module({
  controllers: [DevelopmentEmailOutboxController],
  providers: [DevelopmentEmailOutboxService],
})
export class DevelopmentEmailOutboxModule {}
