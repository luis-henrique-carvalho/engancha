import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { QUEUE_NAMES } from '@engancha/contracts'
import { DatabaseModule } from '../../platform/database/database.module'
import { ConversationsController } from './api/http/conversations.controller'
import { ContactsController } from './api/http/contacts.controller'
import { LeadsController } from './api/http/leads.controller'
import { ConversationsService } from './application/conversations.service'
import { EMAIL_CAPTURE_DISPATCHER } from './domain/ports/email-capture-dispatcher.port'
import { BullMqEmailCaptureDispatcher } from './infrastructure/messaging/bullmq-email-capture.dispatcher'

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.emailCapture,
    }),
  ],
  controllers: [ConversationsController, ContactsController, LeadsController],

  providers: [
    ConversationsService,
    {
      provide: EMAIL_CAPTURE_DISPATCHER,
      useClass: BullMqEmailCaptureDispatcher,
    },
  ],
  exports: [ConversationsService],
})
export class ConversationsModule {}
