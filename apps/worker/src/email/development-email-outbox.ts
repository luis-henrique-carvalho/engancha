import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, type RedisClientType } from 'redis'
import {
  DEVELOPMENT_EMAIL_OUTBOX_TTL_SECONDS,
  developmentEmailOutboxEntrySchema,
  developmentEmailOutboxKey,
  type EmailDeliveryJob,
} from '@engancha/contracts'
import type { WorkerRuntimeConfig } from '../config/runtime-env'

@Injectable()
export class DevelopmentEmailOutbox implements OnModuleDestroy {
  private readonly client: RedisClientType
  private readonly enabled: boolean
  private connectPromise: Promise<void> | undefined

  constructor(config: ConfigService<WorkerRuntimeConfig, true>) {
    this.client = createClient({ url: config.get('redisUrl', { infer: true }) })
    this.enabled = config.get('nodeEnv', { infer: true }) !== 'production'
  }

  async store(job: EmailDeliveryJob): Promise<void> {
    if (!this.enabled) return

    await this.connect()
    const entry = developmentEmailOutboxEntrySchema.parse({
      type: job.type,
      actionUrl: job.actionUrl,
    })
    await this.client.set(developmentEmailOutboxKey(job.correlationId), JSON.stringify(entry), {
      EX: DEVELOPMENT_EMAIL_OUTBOX_TTL_SECONDS,
    })
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) await this.client.quit()
  }

  private async connect(): Promise<void> {
    this.connectPromise ??= this.client.connect().then(() => undefined)
    await this.connectPromise
  }
}
