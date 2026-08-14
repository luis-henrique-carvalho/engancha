import { Inject, Injectable, OnApplicationShutdown, BeforeApplicationShutdown } from '@nestjs/common'
import { WORKER_LOGGER } from './worker-logger.token'

export type EventLogger = { event(event: string, details?: Record<string, unknown>): void }

@Injectable()
export class RuntimeLifecycleService implements BeforeApplicationShutdown, OnApplicationShutdown {
  private shuttingDown = false

  constructor(@Inject(WORKER_LOGGER) private readonly logger: EventLogger) {}

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
