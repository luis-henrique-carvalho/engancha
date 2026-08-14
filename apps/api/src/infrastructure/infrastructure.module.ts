import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Pool } from 'pg'
import {
  InfrastructureHealthService,
  POSTGRES_POOL,
  REDIS_PROBE,
} from './infrastructure-health.service'
import { createRedisProbe } from './redis-probe'

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: POSTGRES_POOL,
      useFactory: (config: ConfigService) =>
        new Pool({
          connectionString: config.getOrThrow<string>('databaseUrl'),
          max: 1,
          connectionTimeoutMillis: 1000,
        }),
      inject: [ConfigService],
    },
    {
      provide: REDIS_PROBE,
      useFactory: (config: ConfigService) =>
        createRedisProbe(config.getOrThrow<string>('redisUrl')),
      inject: [ConfigService],
    },
    {
      provide: InfrastructureHealthService,
      useFactory: (postgres: Pool, redisProbe: ReturnType<typeof createRedisProbe>) =>
        new InfrastructureHealthService(postgres, redisProbe),
      inject: [POSTGRES_POOL, REDIS_PROBE],
    },
  ],
  exports: [InfrastructureHealthService],
})
export class InfrastructureModule {}
