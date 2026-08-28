import assert from 'node:assert/strict'
import test from 'node:test'
import { ServiceUnavailableException } from '@nestjs/common'

import { SimulationsService } from '../apps/api/src/modules/simulations/application/simulations.service.ts'

const context = {
  userId: 'user-1',
  organizationId: 'organization-1',
  membershipId: 'membership-1',
  role: 'member',
}
const comment = {
  contentId: 'content-1',
  provider: 'INSTAGRAM',
  author: 'Ana',
  text: 'Quero o material',
  idempotencyKey: 'simulation-001',
}

function repository(overrides = {}) {
  return {
    findSimulatedContent: async () => ({ id: 'content-1' }),
    createOrFind: async () => ({
      execution: {
        id: 'execution-1',
        status: 'PENDING',
        enqueuedAt: null,
      },
      created: true,
    }),
    markEnqueued: async () => {},
    find: async () => null,
    ...overrides,
  }
}

test('persiste uma execução pendente e enfileira somente dados seguros', async () => {
  const queued = []
  const service = new SimulationsService(repository(), {
    dispatch: async (message) => queued.push(message),
  })

  const response = await service.submit(context, comment)

  assert.deepEqual(response, { executionId: 'execution-1', status: 'PENDING', simulated: true })
  assert.deepEqual(queued, [
    {
      type: 'automation.execution.requested.v1',
      version: 'v1',
      correlationId: 'simulation-001',
      executionId: 'execution-1',
      organizationId: 'organization-1',
    },
  ])
  assert.doesNotMatch(JSON.stringify(queued), /Quero o material|Ana|content snapshot/i)
})

test('reutiliza a execução idempotente sem criar outro ciclo de enfileiramento', async () => {
  const queued = []
  let submissions = 0
  const service = new SimulationsService(
    repository({
      createOrFind: async () => {
        submissions += 1
        return {
          execution: {
            id: 'execution-1',
            status: 'PENDING',
            enqueuedAt: submissions === 1 ? null : new Date(),
          },
          created: submissions === 1,
        }
      },
    }),
    { dispatch: async (message) => queued.push(message) },
  )

  assert.equal((await service.submit(context, comment)).executionId, 'execution-1')
  assert.equal((await service.submit(context, comment)).executionId, 'execution-1')
  assert.equal(queued.length, 1)
})

test('reenvia uma execução pendente mesmo depois de uma tentativa interrompida', async () => {
  const queued = []
  const service = new SimulationsService(
    repository({
      createOrFind: async () => ({
        execution: {
          id: 'execution-1',
          status: 'PENDING',
          enqueuedAt: null,
        },
        created: false,
      }),
    }),
    { dispatch: async (message) => queued.push(message) },
  )

  await service.submit(context, comment)

  assert.equal(queued.length, 1)
})

test('preserva a execução pendente quando a fila está indisponível para permitir reenvio idempotente', async () => {
  const queued = []
  let available = false
  let enqueuedAt = null
  const service = new SimulationsService(
    repository({
      createOrFind: async () => ({
        execution: { id: 'execution-1', status: 'PENDING', enqueuedAt },
        created: enqueuedAt === null,
      }),
      markEnqueued: async () => {
        enqueuedAt = new Date()
      },
    }),
    {
      dispatch: async (message) => {
        if (!available)
          throw new ServiceUnavailableException('Automation execution dispatch unavailable')
        queued.push(message)
      },
    },
  )

  await assert.rejects(
    service.submit(context, comment),
    (error) =>
      error?.getStatus?.() === 503 && error.message === 'Automation execution dispatch unavailable',
  )
  available = true
  assert.equal((await service.submit(context, comment)).executionId, 'execution-1')
  assert.equal(queued.length, 1)
})

test('oculta execuções de outro workspace com 404', async () => {
  const service = new SimulationsService(repository(), { dispatch: async () => {} })

  await assert.rejects(
    service.get(context, 'foreign-execution'),
    (error) => error?.getStatus?.() === 404,
  )
})

test('retry aceita execução FAILED do workspace e enfileira novo ciclo mantendo executionId', async () => {
  const queued = []
  let enqueued = false
  const service = new SimulationsService(
    repository({
      find: async (id, organizationId) => ({
        id,
        organizationId,
        status: 'FAILED',
        idempotencyKey: 'sim-failed-001',
      }),
      resetForRetry: async (id) => ({
        id,
        status: 'PENDING',
        enqueuedAt: null,
        idempotencyKey: 'sim-failed-001',
      }),
      markEnqueued: async () => {
        enqueued = true
      },
    }),
    { dispatch: async (message) => queued.push(message) },
  )

  const response = await service.retry(context, 'exec-failed-1')

  assert.deepEqual(response, {
    executionId: 'exec-failed-1',
    status: 'PENDING',
    simulated: true,
  })
  assert.equal(enqueued, true)
  assert.deepEqual(queued, [
    {
      type: 'automation.execution.requested.v1',
      version: 'v1',
      correlationId: 'sim-failed-001',
      executionId: 'exec-failed-1',
      organizationId: 'organization-1',
    },
  ])
})

test('retry rejeita execuções não FAILED (PENDING, PROCESSING, COMPLETED, IGNORED) com 409 Conflict', async () => {
  const statuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'IGNORED']
  for (const status of statuses) {
    const queued = []
    const service = new SimulationsService(
      repository({
        find: async (id, organizationId) => ({
          id,
          organizationId,
          status,
          idempotencyKey: 'sim-status-001',
        }),
      }),
      { dispatch: async (message) => queued.push(message) },
    )

    await assert.rejects(
      service.retry(context, 'exec-1'),
      (error) =>
        error?.getStatus?.() === 409 &&
        error.response?.code === 'INVALID_EXECUTION_STATE_FOR_RETRY',
    )
    assert.equal(queued.length, 0)
  }
})

test('repetir o POST original de uma execução FAILED retorna a execução e não enfileira novo job', async () => {
  const queued = []
  const service = new SimulationsService(
    repository({
      createOrFind: async () => ({
        execution: {
          id: 'exec-failed-1',
          status: 'FAILED',
          enqueuedAt: new Date(),
        },
        created: false,
      }),
    }),
    { dispatch: async (message) => queued.push(message) },
  )

  const response = await service.submit(context, comment)

  assert.deepEqual(response, {
    executionId: 'exec-failed-1',
    status: 'FAILED',
    simulated: true,
  })
  assert.equal(queued.length, 0)
})

