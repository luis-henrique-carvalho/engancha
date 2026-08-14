import { Body, Controller, NotFoundException, Post } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { VerificationJob } from '@engancha/contracts'
import { isVerificationEndpointEnabled } from './verification.environment'
import { VerificationJobPipe } from './verification-job.pipe'
import { VerificationService } from './verification.service'

@Controller('dev/verification')
export class VerificationController {
  constructor(
    private readonly config: ConfigService,
    private readonly verification: VerificationService,
  ) {}

  @Post()
  enqueue(
    @Body(VerificationJobPipe) body: VerificationJob,
  ): Promise<{ jobId: string; correlationId: string }> {
    const environment = this.config.get<'development' | 'test' | 'production'>('nodeEnv')
    if (!isVerificationEndpointEnabled(environment)) {
      throw new NotFoundException()
    }

    return this.verification.enqueue(body)
  }
}
