import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { StructuredLogger } from './common/structured-logger'
import { RedisReadinessService } from './infrastructure/redis-readiness.service'
import { VerificationProcessor } from './verification/verification.worker'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
  const logger = app.get(StructuredLogger)
  app.useLogger(logger)
  logger.event('bootstrap_started')

  app.enableShutdownHooks()
  const config = app.get(ConfigService)
  await app.get(RedisReadinessService).assertReady()
  await app.get(VerificationProcessor).worker.waitUntilReady()
  logger.event('ready', { environment: config.get('nodeEnv') })
}

void bootstrap().catch(() => {
  console.error('[worker] bootstrap_failed')
  process.exitCode = 1
})
