import { ConfigService } from '@nestjs/config'
import { Module } from '@nestjs/common'
import type { WorkerRuntimeConfig } from '../config/runtime-env'
import { createRedisProbe } from './redis-probe'
import { REDIS_PROBE, RedisReadinessService } from './redis-readiness.service'

@Module({
  providers: [
    {
      provide: REDIS_PROBE,
      useFactory: (config: ConfigService<WorkerRuntimeConfig, true>) =>
        createRedisProbe(config.get('redisUrl', { infer: true })),
      inject: [ConfigService],
    },
    RedisReadinessService,
  ],
  exports: [RedisReadinessService],
})
export class InfrastructureModule {}
