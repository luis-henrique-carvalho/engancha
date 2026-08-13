import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { InfrastructureHealthService } from '../apps/api/src/infrastructure/infrastructure-health.service.ts'
import { RedisReadinessService } from '../apps/worker/src/infrastructure/redis-readiness.service.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('API readiness reports application and dependencies as healthy', async () => {
  const service = new InfrastructureHealthService(
    { query: async () => ({ rows: [{ '?column?': 1 }] }) },
    async () => undefined,
  )
  const report = await service.check()

  assert.deepEqual(report.checks, {
    application: { status: 'up' },
    postgres: { status: 'up' },
    redis: { status: 'up' },
  })
  assert.equal(report.status, 'ok')
  assert.equal(report.service, 'api')
})

test('API readiness returns 503 and safe dependency states when a dependency is unavailable', async () => {
  const secret = 'redis://worker:super-secret@redis.internal:6379/0'
  const service = new InfrastructureHealthService(
    {
      query: async () => {
        throw new Error(`connect ECONNREFUSED ${secret}`)
      },
    },
    async () => {
      throw new Error(`connect ECONNREFUSED ${secret}`)
    },
  )
  const report = await service.check()

  assert.equal(report.status, 'error')
  assert.equal(report.checks.postgres.status, 'down')
  assert.equal(report.checks.redis.status, 'down')
  assert.doesNotMatch(JSON.stringify(report), /super-secret|redis\.internal/)

  const healthController = await readFile(
    path.join(root, 'apps/api/src/health/health.controller.ts'),
    'utf8',
  )
  assert.match(healthController, /: 503/)
})

test('worker readiness fails before ready when Redis cannot be reached', async () => {
  const readiness = new RedisReadinessService(async () => {
    throw new Error('connection refused')
  })

  await assert.rejects(readiness.assertReady(), /Redis dependency unavailable/)
})

test('local infrastructure declares functional Docker health checks and safe defaults', async () => {
  const compose = await readFile(path.join(root, 'docker-compose.yml'), 'utf8')
  const envExample = await readFile(path.join(root, '.env.example'), 'utf8')

  assert.match(compose, /pg_isready/)
  assert.match(compose, /redis-cli.*ping/s)
  assert.match(compose, /healthcheck:/)
  assert.match(envExample, /DATABASE_URL=postgresql:\/\/engancha:engancha@localhost:5432\/engancha/)
  assert.match(envExample, /REDIS_URL=redis:\/\/localhost:6379/)
  assert.match(envExample, /WEB_PORT=3000/)
  assert.doesNotMatch(envExample, /super-secret|private|internal/i)
})
