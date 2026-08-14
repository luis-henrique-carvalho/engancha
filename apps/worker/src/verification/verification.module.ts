import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { queueNames } from '@engancha/contracts'
import { CoreModule } from '../common/core.module'
import { VerificationProcessor } from './verification.worker'
import { VERIFICATION_EXECUTOR, verificationExecutor } from './verification.job'

@Module({
  imports: [CoreModule, BullModule.registerQueue({ name: queueNames.verification })],
  providers: [
    { provide: VERIFICATION_EXECUTOR, useValue: verificationExecutor },
    VerificationProcessor,
  ],
})
export class VerificationModule {}
