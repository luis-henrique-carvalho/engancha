import { Controller, Get, Res } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import type { Response } from 'express'
import { RuntimeLifecycleService } from '../../../../platform/runtime/runtime-lifecycle.service'
import { SkipShutdownGuard } from '../../../../platform/runtime/skip-shutdown-guard.decorator'
import {
  HealthReport,
  InfrastructureHealthService,
} from '../../../../platform/health/infrastructure-health.service'

@Controller('health')
@AllowAnonymous()
export class HealthController {
  constructor(
    private readonly health: InfrastructureHealthService,
    private readonly lifecycle: RuntimeLifecycleService,
  ) {}

  @Get('live')
  @SkipShutdownGuard()
  liveness(): Pick<HealthReport, 'status' | 'service' | 'timestamp'> {
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
    }
  }

  @Get()
  async readiness(@Res({ passthrough: true }) response: Response): Promise<HealthReport> {
    return this.readinessResponse(response)
  }

  @Get('ready')
  async readinessAlias(@Res({ passthrough: true }) response: Response): Promise<HealthReport> {
    return this.readinessResponse(response)
  }

  private async readinessResponse(response: Response): Promise<HealthReport> {
    const report = await this.health.check()
    response.status(report.status === 'ok' && !this.lifecycle.isShuttingDown ? 200 : 503)
    return report
  }
}
