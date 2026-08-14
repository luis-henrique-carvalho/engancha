import { Injectable, OnApplicationShutdown, BeforeApplicationShutdown } from '@nestjs/common'
import { StructuredLogger } from './structured-logger'

@Injectable()
export class RuntimeLifecycleService implements BeforeApplicationShutdown, OnApplicationShutdown {
  private shuttingDown = false

  constructor(private readonly logger: Pick<StructuredLogger, 'event'>) {}

  get isShuttingDown(): boolean {
    return this.shuttingDown
  }

  beforeApplicationShutdown(signal?: string): void {
    if (this.shuttingDown) return

    this.shuttingDown = true
    this.logger.event('shutdown_started', { signal: signal ?? 'application_close' })
  }

  onApplicationShutdown(): void {
    this.logger.event('shutdown_completed')
  }
}
