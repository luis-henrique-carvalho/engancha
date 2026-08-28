import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SIMULATION_UPDATED_EVENT,
  simulationExecutionChannel,
  simulationUpdatedEventSchema,
} from '@engancha/contracts'
import { SimulationsService } from '../apps/api/src/modules/simulations/application/simulations.service.ts'

test('contrato de SimulationUpdatedEvent valida estrutura e canal de roteamento', () => {
  const event = {
    type: SIMULATION_UPDATED_EVENT,
    version: 'v1',
    executionId: 'exec-123',
    organizationId: 'org-456',
    stateVersion: 2,
    status: 'COMPLETED',
    timestamp: '2026-08-28T04:00:00.000Z',
  }

  const parsed = simulationUpdatedEventSchema.safeParse(event)
  assert.equal(parsed.success, true)
  assert.equal(simulationExecutionChannel('exec-123'), 'simulation:execution:exec-123')
})

test('SimulationsService.stream emite snapshot e atualizações disparadas por eventos da porta sem polling', async () => {
  let subscriberCallback = null
  let unsubscribeCalled = false

  const mockSubscriber = {
    subscribe: async (executionId, onEvent) => {
      assert.equal(executionId, 'exec-123')
      subscriberCallback = onEvent
      return async () => {
        unsubscribeCalled = true
      }
    },
  }

  let dbVersion = 1
  let dbStatus = 'PENDING'
  const mockRepository = {
    find: async (id, organizationId) => ({
      id,
      organizationId,
      status: dbStatus,
      provider: 'INSTAGRAM',
      contentId: 'content-1',
      inputAuthor: 'Lucas',
      inputText: 'Oi',
      commentId: null,
      createdAt: new Date('2026-08-28T04:00:00.000Z'),
      matched: dbStatus === 'COMPLETED' ? true : null,
      automationId: dbStatus === 'COMPLETED' ? 'auto-1' : null,
      automationRevision: dbStatus === 'COMPLETED' ? { id: 'rev-1', version: 1 } : null,
      outputs:
        dbStatus === 'COMPLETED'
          ? [
              {
                id: 'out-1',
                key: 'exec-123:0:PUBLIC_REPLY',
                position: 0,
                type: 'PUBLIC_REPLY',
                payload: { text: 'Resposta', simulated: true },
                createdAt: new Date('2026-08-28T04:00:01.000Z'),
              },
            ]
          : [],
      attempts: 1,
      errorCode: null,
      errorMessage: null,
      stateVersion: dbVersion,
    }),
    findSimulatedContent: async () => null,
    createOrFind: async () => null,
    markEnqueued: async () => {},
    resetForRetry: async () => null,
  }

  const service = new SimulationsService(
    mockRepository,
    { dispatch: async () => {} },
    mockSubscriber,
  )

  const observable = await service.stream(
    { userId: 'u1', organizationId: 'org-1', membershipId: 'm1', role: 'member' },
    'exec-123',
    { heartbeatIntervalMs: 10_000, maxDurationMs: 5_000 },
  )

  const emitted = []
  let streamCompleted = false

  observable.subscribe({
    next: (event) => emitted.push(event),
    complete: () => {
      streamCompleted = true
    },
  })

  // 1. Snapshot inicial emitido imediatamente
  assert.equal(emitted.length, 1)
  assert.equal(emitted[0].type, 'snapshot')
  assert.equal(emitted[0].data.status, 'PENDING')
  assert.equal(emitted[0].id, '1')

  // 2. Simula o worker atualizando o PostgreSQL e disparando evento na porta
  dbVersion = 2
  dbStatus = 'COMPLETED'
  assert.ok(subscriberCallback !== null, 'Subscriber callback should be registered')

  await subscriberCallback({
    type: SIMULATION_UPDATED_EVENT,
    version: 'v1',
    executionId: 'exec-123',
    organizationId: 'org-1',
    stateVersion: 2,
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
  })

  // 3. Verifica emissão de update e encerramento terminal
  assert.equal(emitted.length, 2)
  assert.equal(emitted[1].type, 'update')
  assert.equal(emitted[1].data.status, 'COMPLETED')
  assert.equal(emitted[1].id, '2')
  assert.equal(emitted[1].data.outputs.length, 1)
  assert.equal(streamCompleted, true)
  assert.equal(unsubscribeCalled, true)
})
