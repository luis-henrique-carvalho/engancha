import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { emailDeliveryJobOptions, QUEUE_NAMES } from '@engancha/contracts'
import { CoreModule } from '../common/core.module'
import { EMAIL_TRANSPORT } from './email.job'
import { ResendEmailTransport } from './email.transport'
import { EmailDeliveryProcessor } from './email.worker'
import { DevelopmentEmailOutbox } from './development-email-outbox'

@Module({
  imports: [
    CoreModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.emailDelivery,
      defaultJobOptions: emailDeliveryJobOptions,
    }),
  ],
  providers: [
    DevelopmentEmailOutbox,
    ResendEmailTransport,
    {
      provide: EMAIL_TRANSPORT,
      useFactory: (transport: ResendEmailTransport) => transport.asTransport(),
      inject: [ResendEmailTransport],
    },
    EmailDeliveryProcessor,
  ],
})
export class EmailModule {}
