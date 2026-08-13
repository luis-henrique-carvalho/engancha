import test from 'node:test'
import assert from 'node:assert/strict'
import { validateApiEnvironment } from '../apps/api/src/config/runtime-env.ts'
import { validateWorkerEnvironment } from '../apps/worker/src/config/runtime-env.ts'
import { RuntimeLifecycleService as ApiLifecycle } from '../apps/api/src/common/runtime-lifecycle.service.ts'
import { RuntimeLifecycleService as WorkerLifecycle } from '../apps/worker/src/common/runtime-lifecycle.service.ts'

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
  const entries = []
  const logger = { log: (entry) => entries.push(JSON.parse(entry)) }
  const apiLifecycle = new ApiLifecycle(logger)
  const workerLifecycle = new WorkerLifecycle(logger)

  assert.equal(apiLifecycle.isShuttingDown, false)
  apiLifecycle.beforeApplicationShutdown('SIGTERM')
  apiLifecycle.beforeApplicationShutdown('SIGTERM')
  apiLifecycle.onApplicationShutdown()
  workerLifecycle.beforeApplicationShutdown('SIGINT')

  assert.equal(apiLifecycle.isShuttingDown, true)
  assert.equal(workerLifecycle.isShuttingDown, true)
  assert.deepEqual(
    entries.slice(0, 3).map(({ event }) => event),
    ['shutdown_started', 'shutdown_started', 'shutdown_completed'],
  )
  assert.equal(entries[0].service, 'api')
  assert.equal(entries.at(-1).service, 'worker')
})
