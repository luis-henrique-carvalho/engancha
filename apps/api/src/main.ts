import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { StructuredLogger } from './common/structured-logger'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false, bodyParser: false })
  const logger = app.get(StructuredLogger)
  app.useLogger(logger)
  logger.event('bootstrap_started')

  app.enableShutdownHooks()
  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  )
  const config = app.get(ConfigService)
  app.enableCors({ origin: config.getOrThrow<string>('webOrigin'), credentials: true })
  const port = config.getOrThrow<number>('port')
  await app.listen(port)
  logger.event('ready', { port, environment: config.get('nodeEnv') })
}

void bootstrap().catch(() => {
  loggerFallback()
  process.exitCode = 1
})

function loggerFallback(): void {
  console.error('[api] bootstrap_failed')
}
