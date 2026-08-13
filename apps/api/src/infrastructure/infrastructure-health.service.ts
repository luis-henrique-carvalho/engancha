import { Injectable, OnApplicationShutdown } from '@nestjs/common'
import type { Pool } from 'pg'
import type { RedisProbe } from './redis-probe'

export const POSTGRES_POOL = 'API_POSTGRES_POOL'
export const REDIS_PROBE = 'API_REDIS_PROBE'

type PostgresPool = Pick<Pool, 'query' | 'end'>
type DependencyState = { status: 'up' } | { status: 'down' }

export type HealthReport = {
  status: 'ok' | 'error'
  service: 'api'
  checks: {
    application: DependencyState
    postgres: DependencyState
    redis: DependencyState
  }
  timestamp: string
}

@Injectable()
export class InfrastructureHealthService implements OnApplicationShutdown {
  constructor(
    private readonly postgres: PostgresPool,
    private readonly redisProbe: RedisProbe,
  ) {}

  async check(): Promise<HealthReport> {
    const [postgres, redis] = await Promise.all([this.checkPostgres(), this.checkRedis()])
    const healthy = postgres.status === 'up' && redis.status === 'up'

    return {
      status: healthy ? 'ok' : 'error',
      service: 'api',
      checks: {
        application: { status: 'up' },
        postgres,
        redis,
      },
      timestamp: new Date().toISOString(),
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.postgres.end()
  }

  private async checkPostgres(): Promise<DependencyState> {
    try {
      await this.postgres.query('SELECT 1')
      return { status: 'up' }
    } catch {
      return { status: 'down' }
    }
  }

  private async checkRedis(): Promise<DependencyState> {
    try {
      await this.redisProbe()
      return { status: 'up' }
    } catch {
      return { status: 'down' }
    }
  }
}
