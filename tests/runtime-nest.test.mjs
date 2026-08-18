import test from 'node:test'
import assert from 'node:assert/strict'
import { validateApiEnvironment } from '../apps/api/src/platform/config/runtime-env.ts'
import { validateWorkerEnvironment } from '../apps/worker/src/config/runtime-env.ts'
import { RuntimeLifecycleService as ApiLifecycle } from '../apps/api/src/platform/runtime/runtime-lifecycle.service.ts'
import { RuntimeLifecycleService as WorkerLifecycle } from '../apps/worker/src/common/runtime-lifecycle.service.ts'
import { GlobalExceptionFilter } from '../apps/api/src/platform/http/global-exception.filter.ts'
import { resolveRequestId } from '../apps/api/src/platform/http/request-context.middleware.ts'
import { ShutdownGuard } from '../apps/api/src/platform/runtime/shutdown.guard.ts'
import { SkipShutdownGuard } from '../apps/api/src/platform/runtime/skip-shutdown-guard.decorator.ts'
import {
  formatLogEvent,
  shouldSuppressNestStartupLog,
} from '../apps/api/src/platform/runtime/structured-logger.ts'
import { Reflector } from '@nestjs/core'

test('API configuration rejects missing and invalid values without echoing secrets', () => {
  const secret = 'postgresql://private:super-secret@db.internal:5432/app'

  assert.throws(
    () =>
      validateApiEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: secret,
        REDIS_URL: 'not-a-uri',
        PORT: '70000',
      }),
    (error) => {
      assert.match(error.message, /REDIS_URL|PORT/)
      assert.doesNotMatch(error.message, /super-secret|db\.internal/)
      return true
    },
  )
  assert.throws(() => validateApiEnvironment({ NODE_ENV: 'production' }), /DATABASE_URL|REDIS_URL/)
})

test('worker configuration validates environment and does not expose Redis credentials', () => {
  const secret = 'redis://worker:super-secret@redis.internal:6379/0'

  assert.throws(
    () => validateWorkerEnvironment({ NODE_ENV: 'staging', REDIS_URL: secret }),
    (error) => {
      assert.match(error.message, /NODE_ENV/)
      assert.doesNotMatch(error.message, /super-secret|redis\.internal/)
      return true
    },
  )
})

test('runtime lifecycle is idempotent and marks shutdown before cleanup', () => {
  const apiEntries = []
  const workerEntries = []
  const apiLifecycle = new ApiLifecycle({
    event: (event, details = {}) => apiEntries.push({ event, ...details }),
  })
  const workerLifecycle = new WorkerLifecycle({
    event: (event, details = {}) => workerEntries.push({ event, ...details }),
  })

  assert.equal(apiLifecycle.isShuttingDown, false)
  apiLifecycle.beforeApplicationShutdown('SIGTERM')
  apiLifecycle.beforeApplicationShutdown('SIGTERM')
  apiLifecycle.onApplicationShutdown()
  workerLifecycle.beforeApplicationShutdown('SIGINT')

  assert.equal(apiLifecycle.isShuttingDown, true)
  assert.equal(workerLifecycle.isShuttingDown, true)
  assert.deepEqual(
    apiEntries.map(({ event }) => event),
    ['shutdown_started', 'shutdown_completed'],
  )
  assert.equal(apiEntries[0].signal, 'SIGTERM')
  assert.equal(workerEntries[0].event, 'shutdown_started')
  assert.equal(workerEntries[0].signal, 'SIGINT')
})

test('global exception responses expose a request path without its query string', () => {
  const entries = []
  const response = {
    setHeader: () => undefined,
    status: () => response,
    json: (body) => {
      response.body = body
    },
  }
  const filter = new GlobalExceptionFilter({
    event: (event, details) => entries.push({ event, ...details }),
  })
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({
        requestId: 'request-123',
        path: '/api/v1/verification',
        url: '/api/v1/verification?token=secret',
      }),
      getResponse: () => response,
    }),
  }

  filter.catch(new Error('redis://user:secret@internal'), host)

  assert.equal(response.body.path, '/api/v1/verification')
  assert.doesNotMatch(JSON.stringify(response.body), /token=secret|redis:|secret@internal/)
  assert.deepEqual(entries, [
    {
      event: 'request_error',
      requestId: 'request-123',
      statusCode: 500,
      path: '/api/v1/verification',
      errorType: 'Error',
    },
  ])
})

test('accepts only safe incoming correlation IDs', () => {
  assert.equal(resolveRequestId('request-123:api'), 'request-123:api')
  assert.match(resolveRequestId('request\r\nspoofed'), /^[0-9a-f-]{36}$/)
  assert.match(resolveRequestId(['request-123']), /^[0-9a-f-]{36}$/)
})

test('keeps liveness available while the shutdown guard rejects other routes', () => {
  const lifecycle = { isShuttingDown: true }
  const guard = new ShutdownGuard(lifecycle, new Reflector())
  const livenessHandler = () => undefined
  SkipShutdownGuard()({}, 'liveness', { value: livenessHandler })
  class LivenessController {}
  const livenessContext = {
    getHandler: () => livenessHandler,
    getClass: () => LivenessController,
  }
  const applicationHandler = () => undefined
  const applicationContext = {
    getHandler: () => applicationHandler,
    getClass: () => class ApplicationController {},
  }

  assert.equal(guard.canActivate(livenessContext), true)
  assert.throws(
    () => guard.canActivate(applicationContext),
    (error) => error?.getStatus?.() === 503,
  )
})

test('formats application events as concise, readable log messages', () => {
  assert.equal(
    formatLogEvent('ready', { port: 3001, environment: 'development' }),
    'ready port=3001 environment=development',
  )
  assert.equal(
    formatLogEvent('job_succeeded', { jobId: '42', correlationId: 'request 123' }),
    'job_succeeded jobId=42 correlationId="request 123"',
  )
  assert.equal(shouldSuppressNestStartupLog('RouterExplorer'), true)
  assert.equal(shouldSuppressNestStartupLog('api'), false)
})
