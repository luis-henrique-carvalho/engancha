import { createClient } from 'redis'

export type RedisProbe = () => Promise<void>

export function createRedisProbe(redisUrl: string): RedisProbe {
  return async (): Promise<void> => {
    const client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 1000,
        reconnectStrategy: false,
      },
    })

    client.on('error', () => undefined)

    try {
      await client.connect()
      await client.ping()
    } finally {
      if (client.isOpen) {
        await client.quit().catch(() => client.disconnect())
      }
    }
  }
}
