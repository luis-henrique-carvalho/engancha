import { Injectable } from '@nestjs/common'
import type { RedisProbe } from './redis-probe'

export const REDIS_PROBE = 'WORKER_REDIS_PROBE'

@Injectable()
export class RedisReadinessService {
  constructor(private readonly redisProbe: RedisProbe) {}

  async assertReady(): Promise<void> {
    try {
      await this.redisProbe()
    } catch {
      throw new Error('Redis dependency unavailable')
    }
  }
}
