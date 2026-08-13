import {
  Injectable,
  LoggerService,
  OnApplicationShutdown,
  BeforeApplicationShutdown,
} from '@nestjs/common'

@Injectable()
export class RuntimeLifecycleService implements BeforeApplicationShutdown, OnApplicationShutdown {
  private shuttingDown = false

  constructor(private readonly logger: LoggerService) {}

  get isShuttingDown(): boolean {
    return this.shuttingDown
  }

  beforeApplicationShutdown(signal?: string): void {
    this.shuttingDown = true
    this.logger.log(
      JSON.stringify({
        service: 'api',
        event: 'shutdown_started',
        signal: signal ?? 'application_close',
      }),
    )
  }

  onApplicationShutdown(): void {
    this.logger.log(JSON.stringify({ service: 'api', event: 'shutdown_completed' }))
  }
}
