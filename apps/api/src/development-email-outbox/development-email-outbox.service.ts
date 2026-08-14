import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  developmentEmailOutboxEntrySchema,
  developmentEmailOutboxKey,
  type DevelopmentEmailOutboxEntry,
} from '@engancha/contracts'
import { createClient, type RedisClientType } from 'redis'
import type { ApiRuntimeConfig } from '../config/runtime-env'

@Injectable()
export class DevelopmentEmailOutboxService implements OnModuleDestroy {
  private readonly client: RedisClientType
  private connectPromise: Promise<void> | undefined

  constructor(@Inject(ConfigService) config: ConfigService<ApiRuntimeConfig, true>) {
    this.client = createClient({ url: config.get('redisUrl', { infer: true }) })
  }

  async find(correlationId: string): Promise<DevelopmentEmailOutboxEntry | undefined> {
    await this.connect()
    const raw = await this.client.get(developmentEmailOutboxKey(correlationId))
    if (!raw) return undefined

    try {
      return developmentEmailOutboxEntrySchema.parse(JSON.parse(raw))
    } catch {
      return undefined
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) await this.client.quit()
  }

  private async connect(): Promise<void> {
    this.connectPromise ??= this.client.connect().then(() => undefined)
    await this.connectPromise
  }
}
