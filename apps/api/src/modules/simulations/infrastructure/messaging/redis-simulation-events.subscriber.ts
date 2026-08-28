import { Injectable, OnModuleDestroy, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import {
  simulationExecutionChannel,
  simulationUpdatedEventSchema,
  type SimulationUpdatedEvent,
} from '@engancha/contracts'
import type { SimulationEventsSubscriber } from '../../domain/ports/simulation-events-subscriber.port'

@Injectable()
export class RedisSimulationEventsSubscriber
  implements SimulationEventsSubscriber, OnModuleDestroy
{
  private subscriberClient: Redis | null = null
  private readonly listeners = new Map<
    string,
    Set<(event: SimulationUpdatedEvent) => void | Promise<void>>
  >()

  constructor(@Optional() private readonly config?: ConfigService) {}

  private getSubscriber(): Redis {
    if (!this.subscriberClient) {
      const redisUrl =
        this.config?.get<string>('REDIS_URL') ?? process.env.REDIS_URL ?? 'redis://localhost:6379'
      this.subscriberClient = new Redis(redisUrl, {
        lazyConnect: false,
        maxRetriesPerRequest: null,
      })

      this.subscriberClient.on('message', (channel, rawMessage) => {
        const set = this.listeners.get(channel)
        if (!set || set.size === 0) return

        try {
          const parsedJson = JSON.parse(rawMessage)
          const parsed = simulationUpdatedEventSchema.safeParse(parsedJson)
          if (parsed.success) {
            for (const listener of set) {
              try {
                listener(parsed.data)
              } catch {
                // Erros de execução do listener individual são isolados
              }
            }
          }
        } catch {
          // Ignora mensagens corrompidas ou inválidas
        }
      })
    }
    return this.subscriberClient
  }

  async subscribe(
    executionId: string,
    onEvent: (event: SimulationUpdatedEvent) => void | Promise<void>,
  ): Promise<() => Promise<void>> {
    const channel = simulationExecutionChannel(executionId)
    const subscriber = this.getSubscriber()

    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
      await subscriber.subscribe(channel)
    }

    const set = this.listeners.get(channel)!
    set.add(onEvent)

    return async () => {
      set.delete(onEvent)
      if (set.size === 0) {
        this.listeners.delete(channel)
        if (this.subscriberClient) {
          try {
            await this.subscriberClient.unsubscribe(channel)
          } catch {
            // Ignora erros ao desinscrever
          }
        }
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriberClient) {
      this.listeners.clear()
      await this.subscriberClient.quit()
      this.subscriberClient = null
    }
  }
}
