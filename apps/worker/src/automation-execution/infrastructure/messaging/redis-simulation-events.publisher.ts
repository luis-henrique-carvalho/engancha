import { Injectable, OnModuleDestroy, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import {
  simulationExecutionChannel,
  simulationUpdatedEventSchema,
  type SimulationUpdatedEvent,
} from '@engancha/contracts'
import type { SimulationEventsPublisher } from '../../domain/ports/simulation-events-publisher.port'

@Injectable()
export class RedisSimulationEventsPublisher implements SimulationEventsPublisher, OnModuleDestroy {
  private client: Redis | null = null

  constructor(@Optional() private readonly config?: ConfigService) {}

  private getClient(): Redis {
    if (!this.client) {
      const redisUrl =
        this.config?.get<string>('REDIS_URL') ?? process.env.REDIS_URL ?? 'redis://localhost:6379'
      this.client = new Redis(redisUrl, {
        lazyConnect: false,
        maxRetriesPerRequest: null,
      })
    }
    return this.client
  }

  async publish(event: SimulationUpdatedEvent): Promise<void> {
    const parsed = simulationUpdatedEventSchema.safeParse(event)
    if (!parsed.success) return

    try {
      const redis = this.getClient()
      const channel = simulationExecutionChannel(parsed.data.executionId)
      await redis.publish(channel, JSON.stringify(parsed.data))
    } catch {
      // Falhas de publicação não alteram nem bloqueiam a persistência do worker
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.client = null
    }
  }
}
