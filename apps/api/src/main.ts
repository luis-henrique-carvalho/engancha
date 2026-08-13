import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './common/global-exception.filter'
import { ShutdownGuard } from './common/shutdown.guard'
import { StructuredLogger } from './common/structured-logger'

async function bootstrap(): Promise<void> {
  const logger = new StructuredLogger('api')
  logger.event('bootstrap_started')
  const app = await NestFactory.create(AppModule, { logger })

  app.enableShutdownHooks()
  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  )
  app.useGlobalFilters(new GlobalExceptionFilter(logger))
  app.useGlobalGuards(app.get(ShutdownGuard))

  const config = app.get(ConfigService)
  const port = config.getOrThrow<number>('port')
  await app.listen(port)
  logger.event('ready', { port, environment: config.get('nodeEnv') })
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown bootstrap error'
  loggerFallback(message)
  process.exitCode = 1
})

function loggerFallback(message: string): void {
  console.error(JSON.stringify({ service: 'api', event: 'bootstrap_failed', message }))
}
