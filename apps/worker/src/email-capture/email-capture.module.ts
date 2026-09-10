import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { QUEUE_NAMES } from '@engancha/contracts'
import { DatabaseModule } from '../platform/database/database.module'
import { EmailCaptureService } from './application/email-capture.service'
import { EMAIL_CAPTURE_CONSUMER } from './domain/ports/email-capture-consumer.port'
import { EMAIL_CAPTURE_REPOSITORY } from './domain/ports/email-capture-repository.port'
import { BullMqEmailCaptureProcessor } from './infrastructure/messaging/bullmq-email-capture.processor'
import { PrismaEmailCaptureRepository } from './infrastructure/persistence/prisma-email-capture.repository'

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.emailCapture,
    }),
  ],
  providers: [
    BullMqEmailCaptureProcessor,
    EmailCaptureService,
    {
      provide: EMAIL_CAPTURE_CONSUMER,
      useClass: EmailCaptureService,
    },
    {
      provide: EMAIL_CAPTURE_REPOSITORY,
      useClass: PrismaEmailCaptureRepository,
    },
  ],
  exports: [EmailCaptureService],
})
export class EmailCaptureModule {}
