import assert from 'node:assert/strict'
import test from 'node:test'

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
    add: async (...args) => queued.push(args),
  })

  const response = await service.submit(context, comment)

  assert.deepEqual(response, { executionId: 'execution-1', status: 'PENDING', simulated: true })
  assert.deepEqual(queued, [
    [
      'automation-execution',
      {
        version: 'v1',
        correlationId: 'simulation-001',
        executionId: 'execution-1',
        organizationId: 'organization-1',
      },
      { jobId: 'execution-1' },
    ],
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
    { add: async (...args) => queued.push(args) },
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
    { add: async (...args) => queued.push(args) },
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
      add: async (...args) => {
        if (!available) throw new Error('redis unavailable')
        queued.push(args)
      },
    },
  )

  await assert.rejects(
    service.submit(context, comment),
    (error) =>
      error?.getStatus?.() === 503 && error.message === 'Automation execution queue unavailable',
  )
  available = true
  assert.equal((await service.submit(context, comment)).executionId, 'execution-1')
  assert.equal(queued.length, 1)
})

test('oculta execuções de outro workspace com 404', async () => {
  const service = new SimulationsService(repository(), { add: async () => ({ id: 'job-1' }) })

  await assert.rejects(
    service.get(context, 'foreign-execution'),
    (error) => error?.getStatus?.() === 404,
  )
})
