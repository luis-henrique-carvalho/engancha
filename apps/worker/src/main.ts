import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { WORKER_LOGGER } from './common/worker-logger.token'
import type { StructuredLogger } from './common/structured-logger'
import type { WorkerRuntimeConfig } from './config/runtime-env'
import { RedisReadinessService } from './infrastructure/redis-readiness.service'
import { VerificationProcessor } from './verification/verification.worker'
import { EmailDeliveryProcessor } from './email/email.worker'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
  const logger = app.get<StructuredLogger>(WORKER_LOGGER)
  app.useLogger(logger)
  logger.event('bootstrap_started')

  app.enableShutdownHooks()
  const config = app.get<ConfigService<WorkerRuntimeConfig, true>>(ConfigService)
  await app.get(RedisReadinessService).assertReady()
  await app.get(VerificationProcessor).worker.waitUntilReady()
  await app.get(EmailDeliveryProcessor).worker.waitUntilReady()
  logger.event('ready', { environment: config.get('nodeEnv', { infer: true }) })
}

void bootstrap().catch((error: unknown) => {
  console.error('[worker] bootstrap_failed', error)
  process.exitCode = 1
})
