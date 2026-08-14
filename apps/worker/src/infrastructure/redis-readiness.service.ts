import { Inject, Injectable } from '@nestjs/common'
import type { RedisProbe } from './redis-probe'

export const REDIS_PROBE = Symbol('WORKER_REDIS_PROBE')

@Injectable()
export class RedisReadinessService {
  constructor(@Inject(REDIS_PROBE) private readonly redisProbe: RedisProbe) {}

  async assertReady(): Promise<void> {
    try {
      await this.redisProbe()
    } catch {
      throw new Error('Redis dependency unavailable')
    }
  }
}
