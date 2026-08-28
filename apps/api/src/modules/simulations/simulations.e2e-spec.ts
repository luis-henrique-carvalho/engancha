import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, afterEach, before, test } from 'node:test'
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  type INestApplication,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { simulationExecutionResponseSchema } from '@engancha/contracts'
import request, { type Response } from 'supertest'
import type { RequestWithAuthorization } from '../../platform/security/authorization-context'
import { AuthorizationContextGuard } from '../../platform/security/authorization-context'
import { PlatformModule } from '../../platform/platform.module'
import { DatabaseModule } from '../../platform/database/database.module'
import { PrismaService } from '../../platform/database/prisma.service'
import { AutomationsModule } from '../automations/automations.module'
import { AUTOMATION_EXECUTION_DISPATCHER } from './domain/ports/automation-execution-dispatcher.port'
import { SimulationsModule } from './simulations.module'

type WorkspaceScenario = {
  organizationId: string
  userId: string
  headers: Record<string, string>
}

@Injectable()
class FeatureAuthorizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAuthorization>()
    const userId = request.headers?.['x-test-user-id']
    const organizationId = request.headers?.['x-test-organization-id']
    const membershipId = request.headers?.['x-test-membership-id']

    if (
      typeof userId !== 'string' ||
      typeof organizationId !== 'string' ||
      typeof membershipId !== 'string'
    )
      return false

    request.authorizationContext = { userId, organizationId, membershipId, role: 'member' }
    return true
  }
}

let app: INestApplication
let prisma: PrismaService
let queueAvailable = true
let queued: unknown[] = []
let scenarios: WorkspaceScenario[] = []

function expectStatus(response: Response, status: number): void {
  assert.equal(response.status, status, JSON.stringify(response.body))
}

async function createWorkspaceScenario(): Promise<WorkspaceScenario> {
  const suffix = randomUUID()
  const organizationId = randomUUID()
  const userId = randomUUID()
  const membershipId = randomUUID()

  await prisma.client.user.create({
    data: {
      id: userId,
      name: `Simulation test ${suffix}`,
      email: `simulation-${suffix}@example.test`,
    },
  })
  await prisma.client.organization.create({
    data: {
      id: organizationId,
      name: `Simulation test ${suffix}`,
      slug: `simulation-${suffix}`,
      members: { create: { id: membershipId, userId, role: 'member' } },
    },
  })

  const workspace = {
    organizationId,
    userId,
    headers: {
      'x-test-user-id': userId,
      'x-test-organization-id': organizationId,
      'x-test-membership-id': membershipId,
    },
  }
  scenarios.push(workspace)
  return workspace
}

async function createContent(api: ReturnType<typeof request>, workspace: WorkspaceScenario) {
  const response = await api
    .post('/api/v1/simulated-contents')
    .set(workspace.headers)
    .send({ title: 'Post de lançamento', externalContentId: randomUUID() })
  expectStatus(response, 201)
  return response.body
}

before(async () => {
  const module = await Test.createTestingModule({
    imports: [PlatformModule, DatabaseModule, AutomationsModule, SimulationsModule],
  })
    .overrideGuard(AuthorizationContextGuard)
    .useClass(FeatureAuthorizationGuard)
    .overrideProvider(AUTOMATION_EXECUTION_DISPATCHER)
    .useValue({
      dispatch: async (message: unknown) => {
        if (!queueAvailable)
          throw new ServiceUnavailableException('Automation execution dispatch unavailable')
        queued.push(message)
      },
    })
    .compile()

  app = module.createNestApplication({ logger: false })
  app.setGlobalPrefix('api/v1')
  await app.init()
  prisma = module.get(PrismaService)
})

afterEach(async () => {
  await Promise.all(
    scenarios.map(async (workspace) => {
      await prisma.client.automationExecution.deleteMany({
        where: { organizationId: workspace.organizationId },
      })
      await prisma.client.automation.deleteMany({
        where: { organizationId: workspace.organizationId },
      })
      await prisma.client.content.deleteMany({
        where: { organizationId: workspace.organizationId },
      })
      await prisma.client.organization.delete({ where: { id: workspace.organizationId } })
      await prisma.client.user.delete({ where: { id: workspace.userId } })
    }),
  )
  queueAvailable = true
  queued = []
  scenarios = []
})

after(async () => {
  await app.close()
})

test('cria uma execução simulada pendente, enfileira uma vez e expõe sua projeção', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)
  const body = {
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Ana',
    text: 'Quero o material',
    commentId: 'comment-1',
    idempotencyKey: 'simulation-001',
  }

  const first = await api.post('/api/v1/simulations/comments').set(workspace.headers).send(body)
  expectStatus(first, 201)
  assert.equal(first.body.status, 'PENDING')
  assert.equal(first.body.simulated, true)

  const duplicate = await api.post('/api/v1/simulations/comments').set(workspace.headers).send(body)
  expectStatus(duplicate, 201)
  assert.equal(duplicate.body.executionId, first.body.executionId)
  assert.equal(queued.length, 1)
  assert.deepEqual(queued[0], {
    type: 'automation.execution.requested.v1',
    version: 'v1',
    correlationId: 'simulation-001',
    executionId: first.body.executionId,
    organizationId: workspace.organizationId,
  })

  const projection = await api
    .get(`/api/v1/simulations/executions/${first.body.executionId}`)
    .set(workspace.headers)
  expectStatus(projection, 200)
  assert.equal(simulationExecutionResponseSchema.safeParse(projection.body).success, true)
  assert.deepEqual(projection.body.outputs, [])
  assert.equal(projection.body.input.text, 'Quero o material')

  const persisted = await prisma.client.automationExecution.findUniqueOrThrow({
    where: { id: first.body.executionId },
  })
  assert.equal(persisted.mode, 'SIMULATED')
  assert.equal(persisted.channelConnectionId, null)
  assert.equal(persisted.stateVersion, 1)
})

test('rejeita mode e provider não habilitado antes de persistir ou enfileirar', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)

  for (const invalid of [
    {
      contentId: content.id,
      provider: 'INSTAGRAM',
      author: 'Ana',
      text: 'Oi',
      idempotencyKey: 'with-mode',
      mode: 'SIMULATED',
    },
    {
      contentId: content.id,
      provider: 'TIKTOK',
      author: 'Ana',
      text: 'Oi',
      idempotencyKey: 'with-tiktok',
    },
  ]) {
    const response = await api
      .post('/api/v1/simulations/comments')
      .set(workspace.headers)
      .send(invalid)
    expectStatus(response, 400)
  }

  assert.equal(await prisma.client.automationExecution.count(), 0)
  assert.equal(queued.length, 0)
})

test('retorna 503 e preserva a execução pendente para reenvio idempotente quando a fila está indisponível', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)
  queueAvailable = false

  const response = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Ana',
    text: 'Oi',
    idempotencyKey: 'queue-unavailable',
  })
  expectStatus(response, 503)
  assert.equal(await prisma.client.automationExecution.count(), 1)
  queueAvailable = true

  const retry = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Ana',
    text: 'Oi',
    idempotencyKey: 'queue-unavailable',
  })
  expectStatus(retry, 201)
  assert.equal(queued.length, 1)
})

test('aplica 404 para conteúdo e execução de outro workspace', async () => {
  const owner = await createWorkspaceScenario()
  const other = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const foreignContent = await createContent(api, owner)

  const submission = await api.post('/api/v1/simulations/comments').set(other.headers).send({
    contentId: foreignContent.id,
    provider: 'INSTAGRAM',
    author: 'Ana',
    text: 'Oi',
    idempotencyKey: 'foreign-content',
  })
  expectStatus(submission, 404)

  const created = await api.post('/api/v1/simulations/comments').set(owner.headers).send({
    contentId: foreignContent.id,
    provider: 'INSTAGRAM',
    author: 'Ana',
    text: 'Oi',
    idempotencyKey: 'owner-comment',
  })
  expectStatus(created, 201)

  const foreignRead = await api
    .get(`/api/v1/simulations/executions/${created.body.executionId}`)
    .set(other.headers)
  expectStatus(foreignRead, 404)
})
