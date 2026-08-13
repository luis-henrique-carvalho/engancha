import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { StructuredLogger } from './common/structured-logger'
import { RedisReadinessService } from './infrastructure/redis-readiness.service'

async function bootstrap(): Promise<void> {
  const logger = new StructuredLogger('worker')
  logger.event('bootstrap_started')
  const app = await NestFactory.createApplicationContext(AppModule, { logger })

  app.enableShutdownHooks()
  const config = app.get(ConfigService)
  await app.get(RedisReadinessService).assertReady()
  logger.event('ready', { environment: config.get('nodeEnv') })

  const keepAlive = setInterval(() => undefined, 60_000)
  try {
    await new Promise<void>((resolve) => {
      process.once('SIGINT', resolve)
      process.once('SIGTERM', resolve)
    })
  } finally {
    clearInterval(keepAlive)
  }
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown bootstrap error'
  console.error(JSON.stringify({ service: 'worker', event: 'bootstrap_failed', message }))
  process.exitCode = 1
})
