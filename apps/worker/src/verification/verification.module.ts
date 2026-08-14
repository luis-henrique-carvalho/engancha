import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { QUEUE_NAMES } from '@engancha/contracts'
import { CoreModule } from '../common/core.module'
import { VerificationProcessor } from './verification.worker'
import { VERIFICATION_EXECUTOR, verificationExecutor } from './verification.job'

@Module({
  imports: [CoreModule, BullModule.registerQueue({ name: QUEUE_NAMES.VERIFICATION })],
  providers: [
    { provide: VERIFICATION_EXECUTOR, useValue: verificationExecutor },
    VerificationProcessor,
  ],
})
export class VerificationModule {}
