import { Controller, Get, Header, NotFoundException, Param } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import type { ApiRuntimeConfig } from '../../../../platform/config/runtime-env'
import { isVerificationEndpointEnabled } from '../../../verification/application/verification.environment'
import { DevelopmentEmailOutboxService } from '../../application/development-email-outbox.service'

@Controller('dev/email-outbox')
@AllowAnonymous()
export class DevelopmentEmailOutboxController {
  constructor(
    private readonly config: ConfigService<ApiRuntimeConfig, true>,
    private readonly outbox: DevelopmentEmailOutboxService,
  ) {}

  @Get(':correlationId')
  @Header('Cache-Control', 'no-store')
  async find(@Param('correlationId') correlationId: string) {
    if (!isVerificationEndpointEnabled(this.config.get('nodeEnv', { infer: true }))) {
      throw new NotFoundException()
    }

    const entry = await this.outbox.find(correlationId)
    if (!entry) throw new NotFoundException('Email de desenvolvimento não encontrado ou expirado')

    return entry
  }
}
