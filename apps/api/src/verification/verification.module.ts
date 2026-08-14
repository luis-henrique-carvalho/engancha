import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { queueNames, verificationJobOptions } from '@engancha/contracts'
import { VerificationController } from './verification.controller'
import { VerificationJobPipe } from './verification-job.pipe'
import { VerificationService } from './verification.service'

@Module({
  imports: [
    BullModule.registerQueue({
      name: queueNames.verification,
      defaultJobOptions: verificationJobOptions,
    }),
  ],
  controllers: [VerificationController],
  providers: [VerificationJobPipe, VerificationService],
})
export class VerificationModule {}
