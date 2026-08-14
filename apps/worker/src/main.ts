import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { StructuredLogger } from './common/structured-logger'
import { RedisReadinessService } from './infrastructure/redis-readiness.service'
import { VerificationProcessor } from './verification/verification.worker'

async function bootstrap(): Promise<void> {
  const logger = new StructuredLogger('worker')
  logger.event('bootstrap_started')
  const app = await NestFactory.createApplicationContext(AppModule, { logger })

  app.enableShutdownHooks()
  const config = app.get(ConfigService)
  await app.get(RedisReadinessService).assertReady()
  await app.get(VerificationProcessor).worker.waitUntilReady()
  logger.event('ready', { environment: config.get('nodeEnv') })
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown bootstrap error'
  console.error(JSON.stringify({ service: 'worker', event: 'bootstrap_failed', message }))
  process.exitCode = 1
})
