import { Body, Controller, NotFoundException, Post } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { isVerificationEndpointEnabled } from './verification.environment'
import { VerificationService } from './verification.service'

@Controller('dev/verification')
export class VerificationController {
  constructor(
    private readonly config: ConfigService,
    private readonly verification: VerificationService,
  ) {}

  @Post()
  enqueue(@Body() body: unknown): Promise<{ jobId: string; correlationId: string }> {
    const environment = this.config.get<'development' | 'test' | 'production'>('nodeEnv')
    if (!isVerificationEndpointEnabled(environment)) {
      throw new NotFoundException()
    }

    return this.verification.enqueue(body)
  }
}
