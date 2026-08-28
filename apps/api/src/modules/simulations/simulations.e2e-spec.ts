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
import { ConfigModule } from '@nestjs/config'
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
import { SimulationsService } from './application/simulations.service'
import { AutomationExecutionService } from '../../../../worker/src/automation-execution/application/automation-execution.service'
import { PrismaAutomationExecutionRepository } from '../../../../worker/src/automation-execution/infrastructure/persistence/prisma-automation-execution.repository'
import { RedisSimulationEventsPublisher } from '../../../../worker/src/automation-execution/infrastructure/messaging/redis-simulation-events.publisher'
import { apiEnvSchema, validateApiEnvironment } from '../../platform/config/runtime-env'

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

async function createWorkspaceScenario(existingUserId?: string): Promise<WorkspaceScenario> {
  const suffix = randomUUID()
  const organizationId = randomUUID()
  const userId = existingUserId ?? randomUUID()
  const membershipId = randomUUID()

  if (!existingUserId) {
    await prisma.client.user.create({
      data: {
        id: userId,
        name: `Simulation test ${suffix}`,
        email: `simulation-${suffix}@example.test`,
      },
    })
  }
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
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: ['../../.env', '.env'],
        validationSchema: apiEnvSchema,
        validate: validateApiEnvironment,
        validationOptions: { allowUnknown: true, abortEarly: false },
      }),
      PlatformModule,
      DatabaseModule,
      AutomationsModule,
      SimulationsModule,
    ],
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
    }),
  )
  await prisma.client.user.deleteMany({
    where: { id: { in: [...new Set(scenarios.map((workspace) => workspace.userId))] } },
  })
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

test('limita submissões por usuário e workspace, rejeita antes de persistir/enfileirar e recupera após o bloqueio', async () => {
  const workspace = await createWorkspaceScenario()
  const otherWorkspace = await createWorkspaceScenario(workspace.userId)
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)
  const otherContent = await createContent(api, otherWorkspace)

  for (let index = 0; index < 5; index += 1) {
    const response = await api
      .post('/api/v1/simulations/comments')
      .set(workspace.headers)
      .send({
        contentId: content.id,
        provider: 'INSTAGRAM',
        author: 'Rate limit test',
        text: `Comentário ${index}`,
        idempotencyKey: `simulation-rate-${index}`,
      })

    expectStatus(response, 201)
  }

  const rejected = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Rate limit test',
    text: 'Rejeitado',
    idempotencyKey: 'simulation-rate-rejected',
  })

  expectStatus(rejected, 429)
  assert.equal(rejected.body.code, 'SIMULATION_RATE_LIMIT_EXCEEDED')
  assert.equal(rejected.body.message, 'Too many simulation requests. Please try again later.')
  assert.equal(rejected.body.executionId, undefined)
  assert.equal(rejected.body.key, undefined)
  assert.ok(
    rejected.headers['retry-after'],
    `Expected Retry-After header, got: ${JSON.stringify(rejected.headers)}`,
  )
  assert.match(rejected.headers['retry-after'], /^\d+$/)
  assert.equal(
    await prisma.client.automationExecution.count({
      where: { organizationId: workspace.organizationId },
    }),
    5,
  )
  assert.equal(queued.length, 5)

  const isolated = await api.post('/api/v1/simulations/comments').set(otherWorkspace.headers).send({
    contentId: otherContent.id,
    provider: 'INSTAGRAM',
    author: 'Mesmo usuário',
    text: 'Outro workspace',
    idempotencyKey: 'simulation-rate-other-workspace',
  })

  expectStatus(isolated, 201)
  assert.equal(queued.length, 6)

  await new Promise((resolve) => setTimeout(resolve, 1_100))

  const recovered = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Rate limit test',
    text: 'Após bloqueio',
    idempotencyKey: 'simulation-rate-recovered',
  })

  expectStatus(recovered, 201)
  assert.equal(queued.length, 7)
})

test('limita consultas e retries sem bloquear o SSE nem alterar estado após 429', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)

  const created = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Read and retry test',
    text: 'Consulta',
    idempotencyKey: 'simulation-read-retry',
  })
  expectStatus(created, 201)
  const executionId = created.body.executionId

  for (let index = 0; index < 20; index += 1) {
    const response = await api
      .get(`/api/v1/simulations/executions/${executionId}`)
      .set(workspace.headers)

    expectStatus(response, 200)
  }

  const rejectedRead = await api
    .get(`/api/v1/simulations/executions/${executionId}`)
    .set(workspace.headers)
  expectStatus(rejectedRead, 429)
  assert.equal(rejectedRead.body.code, 'SIMULATION_RATE_LIMIT_EXCEEDED')

  await prisma.client.automationExecution.update({
    where: { id: executionId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  })

  const sse = await api
    .get(`/api/v1/simulations/executions/${executionId}/events`)
    .set(workspace.headers)
  expectStatus(sse, 200)
  assert.ok(sse.headers['content-type']?.includes('text/event-stream'))

  await prisma.client.automationExecution.update({
    where: { id: executionId },
    data: { status: 'FAILED', completedAt: new Date() },
  })

  const firstRetry = await api
    .post(`/api/v1/simulations/executions/${executionId}/retry`)
    .set(workspace.headers)
    .send()
  expectStatus(firstRetry, 201)

  for (let index = 0; index < 4; index += 1) {
    const response = await api
      .post(`/api/v1/simulations/executions/${executionId}/retry`)
      .set(workspace.headers)
      .send()

    expectStatus(response, 409)
  }

  const beforeRejectedRetry = await prisma.client.automationExecution.findUniqueOrThrow({
    where: { id: executionId },
    select: { status: true, stateVersion: true, enqueuedAt: true },
  })
  const queuedBeforeRejectedRetry = queued.length

  const rejectedRetry = await api
    .post(`/api/v1/simulations/executions/${executionId}/retry`)
    .set(workspace.headers)
    .send()
  expectStatus(rejectedRetry, 429)
  assert.equal(rejectedRetry.body.code, 'SIMULATION_RATE_LIMIT_EXCEEDED')

  const afterRejectedRetry = await prisma.client.automationExecution.findUniqueOrThrow({
    where: { id: executionId },
    select: { status: true, stateVersion: true, enqueuedAt: true },
  })
  assert.deepEqual(afterRejectedRetry, beforeRejectedRetry)
  assert.equal(queued.length, queuedBeforeRejectedRetry)
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

  assert.equal(
    await prisma.client.automationExecution.count({
      where: { organizationId: workspace.organizationId },
    }),
    0,
  )
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
  assert.equal(
    await prisma.client.automationExecution.count({
      where: { organizationId: workspace.organizationId },
    }),
    1,
  )
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

async function createAndPublishAutomation(
  api: ReturnType<typeof request>,
  workspace: WorkspaceScenario,
  contentId: string,
  keyword: string,
  name = 'Automação de teste',
) {
  const createRes = await api.post('/api/v1/automations').set(workspace.headers).send({ name })
  expectStatus(createRes, 201)
  const automationId = createRes.body.id

  const patchRes = await api
    .patch(`/api/v1/automations/${automationId}`)
    .set(workspace.headers)
    .send({
      targetId: contentId,
      keyword,
      actions: [
        { type: 'PUBLIC_REPLY', text: 'Enviando resposta!' },
        { type: 'LINK', url: 'https://example.test/ebook', label: 'Baixar material' },
      ],
    })
  expectStatus(patchRes, 200)

  const publishRes = await api
    .post(`/api/v1/automations/${automationId}/publish`)
    .set(workspace.headers)
    .send()
  expectStatus(publishRes, 201)

  return { automationId, revisionId: publishRes.body.published.id }
}

test('worker processa jornada positiva completa com resposta pública e link na ordem correta', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)
  const { automationId, revisionId } = await createAndPublishAutomation(
    api,
    workspace,
    content.id,
    'Material',
  )

  const commentRes = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Carlos',
    text: 'Olá! Quero o material por favor.',
    commentId: 'comment-123',
    idempotencyKey: 'sim-match-001',
  })
  expectStatus(commentRes, 201)
  assert.equal(queued.length, 1)

  const workerRepo = new PrismaAutomationExecutionRepository(prisma)
  const workerService = new AutomationExecutionService(workerRepo)
  const result = await workerService.consume(queued[0] as never)

  assert.equal(result.status, 'COMPLETED')
  assert.equal(result.matched, true)
  assert.equal(result.automationId, automationId)
  assert.equal(result.revisionId, revisionId)

  // Redelivery do mesmo job não duplica saídas nem falha
  const redeliveryResult = await workerService.consume(queued[0] as never)
  assert.equal(redeliveryResult.status, 'SKIPPED')

  const projection = await api
    .get(`/api/v1/simulations/executions/${commentRes.body.executionId}`)
    .set(workspace.headers)
  expectStatus(projection, 200)
  assert.equal(projection.body.status, 'COMPLETED')
  assert.equal(projection.body.simulated, true)
  assert.equal(projection.body.matched, true)
  assert.equal(projection.body.automation?.id, automationId)
  assert.equal(projection.body.automation?.revisionId, revisionId)
  assert.equal(projection.body.automation?.version, 1)
  assert.equal(projection.body.outputs.length, 2)
  assert.deepEqual(projection.body.outputs[0], {
    id: projection.body.outputs[0].id,
    key: `${commentRes.body.executionId}:0:PUBLIC_REPLY`,
    position: 0,
    type: 'PUBLIC_REPLY',
    payload: { text: 'Enviando resposta!', simulated: true },
    createdAt: projection.body.outputs[0].createdAt,
  })
  assert.deepEqual(projection.body.outputs[1], {
    id: projection.body.outputs[1].id,
    key: `${commentRes.body.executionId}:1:LINK_DELIVERY`,
    position: 1,
    type: 'LINK_DELIVERY',
    payload: { url: 'https://example.test/ebook', label: 'Baixar material', simulated: true },
    createdAt: projection.body.outputs[1].createdAt,
  })

  const persisted = await prisma.client.automationExecution.findUniqueOrThrow({
    where: { id: commentRes.body.executionId },
    include: { outputs: true },
  })
  assert.equal(persisted.matched, true)
  assert.equal(persisted.status, 'COMPLETED')
  assert.ok(persisted.completedAt !== null)
  assert.equal(persisted.outputs.length, 2)
  assert.deepEqual(persisted.automationSnapshot, {
    automationId,
    revisionId,
    version: 1,
    target: { contentId: content.id },
    trigger: {
      type: 'COMMENT_KEYWORD',
      keyword: 'Material',
      keywordNormalized: 'material',
    },
    actions: [
      {
        position: 0,
        type: 'PUBLIC_REPLY',
        config: { text: 'Enviando resposta!', type: 'PUBLIC_REPLY' },
      },
      {
        position: 1,
        type: 'LINK',
        config: { url: 'https://example.test/ebook', label: 'Baixar material', type: 'LINK' },
      },
    ],
  })

  // Alterações posteriores na automação (draft, pausa) não alteram o snapshot da execução já concluída
  await api
    .patch(`/api/v1/automations/${automationId}`)
    .set(workspace.headers)
    .send({ keyword: 'NovoKeyword' })
  await api.post(`/api/v1/automations/${automationId}/pause`).set(workspace.headers).send()

  const projectionAfterEdit = await api
    .get(`/api/v1/simulations/executions/${commentRes.body.executionId}`)
    .set(workspace.headers)
  expectStatus(projectionAfterEdit, 200)
  assert.equal(projectionAfterEdit.body.automation?.id, automationId)
  assert.equal(projectionAfterEdit.body.matched, true)
  assert.equal(projectionAfterEdit.body.status, 'COMPLETED')
})

test('worker processa jornada com CAPTURE_EMAIL gerando EMAIL_CAPTURE_REQUEST sem criar entidades da Fase 5', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)

  const createRes = await api
    .post('/api/v1/automations')
    .set(workspace.headers)
    .send({ name: 'Captura de Leads' })
  expectStatus(createRes, 201)
  const automationId = createRes.body.id

  const patchRes = await api
    .patch(`/api/v1/automations/${automationId}`)
    .set(workspace.headers)
    .send({
      targetId: content.id,
      keyword: 'QueroAcesso',
      actions: [
        { type: 'PUBLIC_REPLY', text: 'Te enviei uma DM!' },
        { type: 'CAPTURE_EMAIL', prompt: 'Qual é o seu melhor e-mail para receber o acesso?' },
      ],
    })
  expectStatus(patchRes, 200)

  const publishRes = await api
    .post(`/api/v1/automations/${automationId}/publish`)
    .set(workspace.headers)
    .send()
  expectStatus(publishRes, 201)
  const revisionId = publishRes.body.published.id

  const commentRes = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Juliana',
    text: 'QueroAcesso agora!',
    commentId: 'comment-email-01',
    idempotencyKey: 'sim-capture-email-001',
  })
  expectStatus(commentRes, 201)

  const workerRepo = new PrismaAutomationExecutionRepository(prisma)
  const workerService = new AutomationExecutionService(workerRepo)
  const result = await workerService.consume(queued[0] as never)

  assert.equal(result.status, 'COMPLETED')
  assert.equal(result.matched, true)
  assert.equal(result.automationId, automationId)
  assert.equal(result.revisionId, revisionId)

  const projection = await api
    .get(`/api/v1/simulations/executions/${commentRes.body.executionId}`)
    .set(workspace.headers)
  expectStatus(projection, 200)
  assert.equal(projection.body.status, 'COMPLETED')
  assert.equal(projection.body.simulated, true)
  assert.equal(projection.body.matched, true)
  assert.equal(projection.body.outputs.length, 2)
  assert.deepEqual(projection.body.outputs[0], {
    id: projection.body.outputs[0].id,
    key: `${commentRes.body.executionId}:0:PUBLIC_REPLY`,
    position: 0,
    type: 'PUBLIC_REPLY',
    payload: { text: 'Te enviei uma DM!', simulated: true },
    createdAt: projection.body.outputs[0].createdAt,
  })
  assert.deepEqual(projection.body.outputs[1], {
    id: projection.body.outputs[1].id,
    key: `${commentRes.body.executionId}:1:EMAIL_CAPTURE_REQUEST`,
    position: 1,
    type: 'EMAIL_CAPTURE_REQUEST',
    payload: {
      prompt: 'Qual é o seu melhor e-mail para receber o acesso?',
      simulated: true,
    },
    createdAt: projection.body.outputs[1].createdAt,
  })

  // Comprova fronteira: nenhuma entidade externa ou da Fase 5 criada
  const execution = await prisma.client.automationExecution.findUniqueOrThrow({
    where: { id: commentRes.body.executionId },
  })
  assert.equal(execution.channelConnectionId, null)
  assert.equal(execution.mode, 'SIMULATED')
})

test('worker conclui como IGNORED sem saídas quando nenhuma automação corresponde ao comentário', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)
  await createAndPublishAutomation(api, workspace, content.id, 'Ebook')

  const commentRes = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Lucas',
    text: 'Adorei a publicação!',
    idempotencyKey: 'sim-nomatch-001',
  })
  expectStatus(commentRes, 201)

  const workerRepo = new PrismaAutomationExecutionRepository(prisma)
  const workerService = new AutomationExecutionService(workerRepo)
  const result = await workerService.consume(queued[0] as never)

  assert.equal(result.status, 'IGNORED')
  assert.equal(result.matched, false)

  const projection = await api
    .get(`/api/v1/simulations/executions/${commentRes.body.executionId}`)
    .set(workspace.headers)
  expectStatus(projection, 200)
  assert.equal(projection.body.status, 'IGNORED')
  assert.equal(projection.body.matched, false)
  assert.equal(projection.body.automation, null)
  assert.deepEqual(projection.body.outputs, [])
})

test('worker falha fechado com AMBIGUOUS_AUTOMATION_MATCH se múltiplos matches forem encontrados', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)
  await createAndPublishAutomation(api, workspace, content.id, 'Material', 'Auto 1')
  await createAndPublishAutomation(api, workspace, content.id, 'Ebook', 'Auto 2')

  const commentRes = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Lucas',
    text: 'Quero material e ebook',
    idempotencyKey: 'sim-ambiguous-001',
  })
  expectStatus(commentRes, 201)

  const workerRepo = new PrismaAutomationExecutionRepository(prisma)
  const workerService = new AutomationExecutionService(workerRepo)
  const result = await workerService.consume(queued[0] as never)

  assert.equal(result.status, 'FAILED')
  assert.equal(result.matched, false)
  assert.equal(result.errorCode, 'AMBIGUOUS_AUTOMATION_MATCH')

  const projection = await api
    .get(`/api/v1/simulations/executions/${commentRes.body.executionId}`)
    .set(workspace.headers)
  expectStatus(projection, 200)
  assert.equal(projection.body.status, 'FAILED')
  assert.equal(projection.body.error?.code, 'AMBIGUOUS_AUTOMATION_MATCH')
  assert.equal(projection.body.automation, null)
  assert.deepEqual(projection.body.outputs, [])
})

test('worker não seleciona automação pausada antes do claim', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)
  const { automationId } = await createAndPublishAutomation(api, workspace, content.id, 'Material')
  await api.post(`/api/v1/automations/${automationId}/pause`).set(workspace.headers).send()

  const commentRes = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Carlos',
    text: 'Quero o material',
    idempotencyKey: 'sim-paused-001',
  })
  expectStatus(commentRes, 201)

  const workerRepo = new PrismaAutomationExecutionRepository(prisma)
  const workerService = new AutomationExecutionService(workerRepo)
  const result = await workerService.consume(queued[0] as never)

  assert.equal(result.status, 'IGNORED')
  assert.equal(result.matched, false)
})

test('claim condicional impede processamento simultâneo em workers concorrentes ou redelivery', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)
  await createAndPublishAutomation(api, workspace, content.id, 'Material')

  const commentRes = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Carlos',
    text: 'Quero o material',
    idempotencyKey: 'sim-concurrent-001',
  })
  expectStatus(commentRes, 201)

  const workerRepo = new PrismaAutomationExecutionRepository(prisma)
  const workerService = new AutomationExecutionService(workerRepo)

  const [firstWorker, secondWorker] = await Promise.all([
    workerService.consume(queued[0] as never),
    workerService.consume(queued[0] as never),
  ])

  const statuses = [firstWorker.status, secondWorker.status]
  assert.ok(statuses.includes('COMPLETED'))
  assert.ok(statuses.includes('SKIPPED'))

  const persisted = await prisma.client.automationExecution.findUniqueOrThrow({
    where: { id: commentRes.body.executionId },
  })
  assert.equal(persisted.attempts, 1)
})

test('POST /executions/:id/retry reprocessa com sucesso uma execução FAILED mantendo a mesma identidade', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)
  const { automationId, revisionId } = await createAndPublishAutomation(
    api,
    workspace,
    content.id,
    'Material',
  )

  const commentRes = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Renata',
    text: 'Quero o material',
    idempotencyKey: 'sim-retry-flow-001',
  })
  expectStatus(commentRes, 201)
  const executionId = commentRes.body.executionId

  // Simular falha transitória que esgotou tentativas -> FAILED
  await prisma.client.automationExecution.update({
    where: { id: executionId },
    data: {
      status: 'FAILED',
      errorCode: 'EXECUTION_FAILED',
      errorMessage: 'Falha ao processar execução',
      completedAt: new Date(),
      attempts: 4,
    },
  })

  // Reenviar POST original da execução FAILED retorna o registro existente sem re-enfileirar
  const duplicatePost = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Renata',
    text: 'Quero o material',
    idempotencyKey: 'sim-retry-flow-001',
  })
  expectStatus(duplicatePost, 201)
  assert.equal(duplicatePost.body.executionId, executionId)
  assert.equal(duplicatePost.body.status, 'FAILED')
  assert.equal(queued.length, 1) // apenas o dispatch inicial

  // Executar retry explícito
  const retryRes = await api
    .post(`/api/v1/simulations/executions/${executionId}/retry`)
    .set(workspace.headers)
    .send()
  expectStatus(retryRes, 201)
  assert.equal(retryRes.body.executionId, executionId)
  assert.equal(retryRes.body.status, 'PENDING')
  assert.equal(retryRes.body.simulated, true)
  assert.equal(queued.length, 2)

  // Worker reprocessa o novo ciclo com sucesso
  const workerRepo = new PrismaAutomationExecutionRepository(prisma)
  const workerService = new AutomationExecutionService(workerRepo)
  const result = await workerService.consume(queued[1] as never)

  assert.equal(result.status, 'COMPLETED')
  assert.equal(result.matched, true)
  assert.equal(result.automationId, automationId)
  assert.equal(result.revisionId, revisionId)

  // Projeção final via GET
  const finalProjection = await api
    .get(`/api/v1/simulations/executions/${executionId}`)
    .set(workspace.headers)
  expectStatus(finalProjection, 200)
  assert.equal(finalProjection.body.status, 'COMPLETED')
  assert.equal(finalProjection.body.error, null)
  assert.equal(finalProjection.body.outputs.length, 2)
  assert.equal(finalProjection.body.outputs[0].key, `${executionId}:0:PUBLIC_REPLY`)
  assert.equal(finalProjection.body.outputs[1].key, `${executionId}:1:LINK_DELIVERY`)
})

test('POST /executions/:id/retry rejeita estados não-FAILED e cross-workspace', async () => {
  const owner = await createWorkspaceScenario()
  const other = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, owner)

  const commentRes = await api.post('/api/v1/simulations/comments').set(owner.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Beatriz',
    text: 'Olá',
    idempotencyKey: 'sim-retry-states-001',
  })
  expectStatus(commentRes, 201)
  const executionId = commentRes.body.executionId

  // Tentativa de retry em estado PENDING -> 409
  const pendingRetry = await api
    .post(`/api/v1/simulations/executions/${executionId}/retry`)
    .set(owner.headers)
    .send()
  expectStatus(pendingRetry, 409)

  // Tentativa de retry por outro workspace -> 404
  const foreignRetry = await api
    .post(`/api/v1/simulations/executions/${executionId}/retry`)
    .set(other.headers)
    .send()
  expectStatus(foreignRetry, 404)

  // Atualizar para COMPLETED -> 409
  await prisma.client.automationExecution.update({
    where: { id: executionId },
    data: { status: 'COMPLETED' },
  })
  const completedRetry = await api
    .post(`/api/v1/simulations/executions/${executionId}/retry`)
    .set(owner.headers)
    .send()
  expectStatus(completedRetry, 409)

  // Atualizar para IGNORED -> 409
  await prisma.client.automationExecution.update({
    where: { id: executionId },
    data: { status: 'IGNORED' },
  })
  const ignoredRetry = await api
    .post(`/api/v1/simulations/executions/${executionId}/retry`)
    .set(owner.headers)
    .send()
  expectStatus(ignoredRetry, 409)
})

test('retries concorrentes em execução FAILED: apenas um tem sucesso e o outro recebe 409', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)

  const commentRes = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Daniel',
    text: 'Quero o material',
    idempotencyKey: 'sim-concurrent-retry-001',
  })
  expectStatus(commentRes, 201)
  const executionId = commentRes.body.executionId

  await prisma.client.automationExecution.update({
    where: { id: executionId },
    data: { status: 'FAILED', completedAt: new Date() },
  })

  const [res1, res2] = await Promise.all([
    api.post(`/api/v1/simulations/executions/${executionId}/retry`).set(workspace.headers).send(),
    api.post(`/api/v1/simulations/executions/${executionId}/retry`).set(workspace.headers).send(),
  ])

  const statuses = [res1.status, res2.status].sort()
  assert.deepEqual(statuses, [201, 409])
})

function parseSseEvents(raw: string): Array<{ type?: string; id?: string; data: any }> {
  const blocks = raw.split('\n\n').filter((b) => b.trim().length > 0)
  return blocks.map((block) => {
    const lines = block.split('\n')
    let type: string | undefined
    let id: string | undefined
    let dataStr = ''
    for (const line of lines) {
      if (line.startsWith('event:')) {
        type = line.replace('event:', '').trim()
      } else if (line.startsWith('id:')) {
        id = line.replace('id:', '').trim()
      } else if (line.startsWith('data:')) {
        dataStr += (dataStr ? '\n' : '') + line.replace('data:', '').trim()
      }
    }
    let data: any = null
    try {
      data = JSON.parse(dataStr)
    } catch {
      data = dataStr
    }
    return { type, id, data }
  })
}

test('GET /simulations/executions/:id/events autentica sessão/workspace e retorna 404 para execução estrangeira ou inexistente', async () => {
  const owner = await createWorkspaceScenario()
  const other = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, owner)

  const commentRes = await api.post('/api/v1/simulations/comments').set(owner.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Alice',
    text: 'Quero saber mais',
    idempotencyKey: 'sim-sse-auth-001',
  })
  expectStatus(commentRes, 201)
  const executionId = commentRes.body.executionId

  // Execução inexistente -> 404
  const notFoundRes = await api
    .get('/api/v1/simulations/executions/non-existent-id/events')
    .set(owner.headers)
  expectStatus(notFoundRes, 404)

  // Execução de outro workspace -> 404
  const foreignRes = await api
    .get(`/api/v1/simulations/executions/${executionId}/events`)
    .set(other.headers)
  expectStatus(foreignRes, 404)

  // Sem headers de autorização -> 403
  const unauthRes = await api.get(`/api/v1/simulations/executions/${executionId}/events`)
  expectStatus(unauthRes, 403)
})

test('GET /simulations/executions/:id/events emite snapshot inicial e encerra para execução já terminal', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)

  const commentRes = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Alice',
    text: 'Quero o material',
    idempotencyKey: 'sim-sse-term-001',
  })
  expectStatus(commentRes, 201)
  const executionId = commentRes.body.executionId

  // Marcar como COMPLETED no PostgreSQL
  await prisma.client.automationExecution.update({
    where: { id: executionId },
    data: {
      status: 'COMPLETED',
      matched: true,
      completedAt: new Date(),
      stateVersion: 2,
    },
  })

  const sseRes = await api
    .get(`/api/v1/simulations/executions/${executionId}/events`)
    .set(workspace.headers)

  expectStatus(sseRes, 200)
  assert.ok(sseRes.headers['content-type']?.includes('text/event-stream'))

  const events = parseSseEvents(sseRes.text)
  assert.equal(events.length, 1)
  assert.equal(events[0].type, 'snapshot')
  assert.equal(events[0].id, '2')
  assert.equal(events[0].data.id, executionId)
  assert.equal(events[0].data.status, 'COMPLETED')
  assert.equal(events[0].data.matched, true)
})

test('GET /simulations/executions/:id/events emite snapshot inicial e atualizações monotônicas com saídas reconciliadas no PostgreSQL até estado terminal', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)
  const { automationId, revisionId } = await createAndPublishAutomation(
    api,
    workspace,
    content.id,
    'Material',
  )

  const commentRes = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Bruno',
    text: 'Quero o material agora!',
    idempotencyKey: 'sim-sse-flow-001',
  })
  expectStatus(commentRes, 201)
  const executionId = commentRes.body.executionId

  // Iniciar stream observável baseado em eventos para capturar snapshot e updates
  const simulationsService = app.get(SimulationsService)
  const streamObservable = await simulationsService.stream(
    {
      userId: workspace.userId,
      organizationId: workspace.organizationId,
      membershipId: 'test',
      role: 'member',
    },
    executionId,
    {
      heartbeatIntervalMs: 500,
      maxDurationMs: 2000,
    },
  )

  const emitted: Array<any> = []
  const streamPromise = new Promise<void>((resolve, reject) => {
    streamObservable.subscribe({
      next: (event: any) => emitted.push(event),
      complete: () => resolve(),
      error: (err: unknown) => reject(err),
    })
  })

  // Permite que a subscription registre o snapshot e a inscrição no canal
  await new Promise((resolve) => setTimeout(resolve, 50))

  const workerRepo = new PrismaAutomationExecutionRepository(prisma)
  const publisher = new RedisSimulationEventsPublisher()
  const workerService = new AutomationExecutionService(workerRepo, publisher)
  await workerService.consume(queued[0] as never)

  await streamPromise

  assert.ok(emitted.length >= 2, `Expected at least 2 events, got: ${JSON.stringify(emitted)}`)

  // 1. Primeiro evento é o snapshot
  const snapshot = emitted[0]
  assert.equal(snapshot.type, 'snapshot')
  assert.equal(snapshot.data.id, executionId)
  assert.equal(snapshot.data.status, 'PENDING')
  assert.equal(snapshot.id, '1')

  // 2. Último evento é o update terminal com outputs persistidos
  const terminal = emitted[emitted.length - 1]
  assert.equal(terminal.type, 'update')
  assert.equal(terminal.data.status, 'COMPLETED')
  assert.equal(terminal.data.matched, true)
  assert.equal(terminal.data.automation?.id, automationId)
  assert.equal(terminal.data.automation?.revisionId, revisionId)
  assert.equal(terminal.data.outputs.length, 2)
  assert.equal(terminal.data.outputs[0].type, 'PUBLIC_REPLY')
  assert.equal(terminal.data.outputs[1].type, 'LINK_DELIVERY')
  assert.ok(Number(terminal.id) > Number(snapshot.id))
})

test('Stream SSE emite heartbeats com tipo heartbeat e não polui atividades de produto', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)

  const commentRes = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Clara',
    text: 'Aguardando',
    idempotencyKey: 'sim-sse-heartbeat-001',
  })
  expectStatus(commentRes, 201)
  const executionId = commentRes.body.executionId

  // Acessar diretamente o serviço com heartbeatIntervalMs e maxDurationMs curtos
  const simulationsService = app.get(SimulationsService)
  const streamObservable = await simulationsService.stream(
    {
      userId: workspace.userId,
      organizationId: workspace.organizationId,
      membershipId: 'test',
      role: 'member',
    },
    executionId,
    {
      heartbeatIntervalMs: 80,
      maxDurationMs: 250,
    },
  )

  const emitted: Array<any> = []
  await new Promise<void>((resolve, reject) => {
    streamObservable.subscribe({
      next: (event: any) => emitted.push(event),
      complete: () => resolve(),
      error: (err: unknown) => reject(err),
    })
  })

  // Snapshot inicial
  assert.equal(emitted[0].type, 'snapshot')
  assert.equal(emitted[0].data.status, 'PENDING')

  // Ao menos um heartbeat emitido
  const heartbeats = emitted.filter((e) => e.type === 'heartbeat')
  assert.ok(heartbeats.length >= 1, 'Expected at least 1 heartbeat event')
  assert.equal(heartbeats[0].data.heartbeat, true)
  assert.ok(typeof heartbeats[0].data.timestamp === 'string')

  // Verifica que a execução no PostgreSQL continua PENDING intacta
  const persisted = await prisma.client.automationExecution.findUniqueOrThrow({
    where: { id: executionId },
  })
  assert.equal(persisted.status, 'PENDING')
})

test('Recuperação HTTP após desconexão SSE: consulta estado atualizado via GET e permite nova conexão', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, workspace)

  const commentRes = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: content.id,
    provider: 'INSTAGRAM',
    author: 'Diego',
    text: 'Testando desconexão',
    idempotencyKey: 'sim-sse-reconnect-001',
  })
  expectStatus(commentRes, 201)
  const executionId = commentRes.body.executionId

  // Simula cliente conectando e cancelando subscription enquanto PENDING
  const simulationsService = app.get(SimulationsService)
  const firstStream = await simulationsService.stream(
    {
      userId: workspace.userId,
      organizationId: workspace.organizationId,
      membershipId: 'test',
      role: 'member',
    },
    executionId,
    {
      heartbeatIntervalMs: 100,
      maxDurationMs: 500,
    },
  )

  const sub = firstStream.subscribe()
  // Cancela a subscription (desconexão do cliente)
  sub.unsubscribe()

  // Cliente recupera estado autoritativo via HTTP GET
  const getRes = await api
    .get(`/api/v1/simulations/executions/${executionId}`)
    .set(workspace.headers)
  expectStatus(getRes, 200)
  assert.equal(getRes.body.status, 'PENDING')

  // Worker conclui a execução como IGNORED
  const workerRepo = new PrismaAutomationExecutionRepository(prisma)
  const workerService = new AutomationExecutionService(workerRepo)
  await workerService.consume(queued[0] as never)

  // Cliente reconecta no SSE via HTTP e recebe snapshot atualizado com estado terminal
  const reconnectSse = await api
    .get(`/api/v1/simulations/executions/${executionId}/events`)
    .set(workspace.headers)
  expectStatus(reconnectSse, 200)

  const events = parseSseEvents(reconnectSse.text)
  assert.equal(events.length, 1)
  assert.equal(events[0].type, 'snapshot')
  assert.equal(events[0].data.status, 'IGNORED')
  assert.equal(events[0].data.matched, false)
})

test('GET /simulations/executions lista somente o workspace ativo, aceita filtro por automationId e usa paginação por cursor', async () => {
  const workspaceA = await createWorkspaceScenario()
  const workspaceB = await createWorkspaceScenario()
  const api = request(app.getHttpServer())

  const contentA = await createContent(api, workspaceA)
  const contentB = await createContent(api, workspaceB)

  const automationA = await createAndPublishAutomation(api, workspaceA, contentA.id, 'PROMO')

  // Cria 3 execuções no workspace A:
  // 1: matched automationA
  const resA1 = await api.post('/api/v1/simulations/comments').set(workspaceA.headers).send({
    contentId: contentA.id,
    provider: 'INSTAGRAM',
    author: 'Alice',
    text: 'Quero PROMO',
    idempotencyKey: 'list-exec-001',
    originAutomationId: automationA.automationId,
  })
  expectStatus(resA1, 201)

  // 2: ignored (sem match), mas originAutomationId é automationA.automationId
  const resA2 = await api.post('/api/v1/simulations/comments').set(workspaceA.headers).send({
    contentId: contentA.id,
    provider: 'INSTAGRAM',
    author: 'Bob',
    text: 'Outro assunto qualquer',
    idempotencyKey: 'list-exec-002',
    originAutomationId: automationA.automationId,
  })
  expectStatus(resA2, 201)

  // 3: outra execução sem automationId vinculada
  const resA3 = await api.post('/api/v1/simulations/comments').set(workspaceA.headers).send({
    contentId: contentA.id,
    provider: 'INSTAGRAM',
    author: 'Carol',
    text: 'Comentário sem origem de automação',
    idempotencyKey: 'list-exec-003',
  })
  expectStatus(resA3, 201)

  // Cria 1 execução no workspace B
  const resB = await api.post('/api/v1/simulations/comments').set(workspaceB.headers).send({
    contentId: contentB.id,
    provider: 'INSTAGRAM',
    author: 'Daniel',
    text: 'Comentário do workspace B',
    idempotencyKey: 'list-exec-004',
  })
  expectStatus(resB, 201)

  // 1. Isolamento: listagem do workspace A não contém execuções do workspace B
  const listAllA = await api.get('/api/v1/simulations/executions').set(workspaceA.headers)
  expectStatus(listAllA, 200)
  assert.equal(listAllA.body.items.length, 3)
  assert.ok(listAllA.body.items.every((it: any) => it.id !== resB.body.executionId))
  assert.equal(listAllA.body.hasMore, false)
  assert.equal(listAllA.body.nextCursor, null)

  // 2. Filtro por automationId: retorna A1 e A2 (já que A1 e A2 tem originAutomationId = automationA.automationId)
  const listFilteredA = await api
    .get(`/api/v1/simulations/executions?automationId=${automationA.automationId}`)
    .set(workspaceA.headers)
  expectStatus(listFilteredA, 200)
  assert.equal(listFilteredA.body.items.length, 2)
  const returnedIds = listFilteredA.body.items.map((i: any) => i.id)
  assert.ok(returnedIds.includes(resA1.body.executionId))
  assert.ok(returnedIds.includes(resA2.body.executionId))
  assert.ok(!returnedIds.includes(resA3.body.executionId))

  // 3. Projeção: inclui conteúdo, autor, texto, simulação, status
  const itemA1 = listFilteredA.body.items.find((i: any) => i.id === resA1.body.executionId)
  assert.ok(itemA1)
  assert.equal(itemA1.simulated, true)
  assert.equal(itemA1.input.author, 'Alice')
  assert.equal(itemA1.input.text, 'Quero PROMO')
  assert.ok(itemA1.content)
  assert.equal(itemA1.content.id, contentA.id)
  assert.equal(itemA1.originAutomationId, automationA.automationId)

  // 4. Paginação por cursor estável: limit=1
  const page1 = await api.get('/api/v1/simulations/executions?limit=1').set(workspaceA.headers)
  expectStatus(page1, 200)
  assert.equal(page1.body.items.length, 1)
  assert.equal(page1.body.hasMore, true)
  assert.ok(page1.body.nextCursor)
  const firstId = page1.body.items[0].id

  const page2 = await api
    .get(`/api/v1/simulations/executions?limit=1&cursor=${page1.body.nextCursor}`)
    .set(workspaceA.headers)
  expectStatus(page2, 200)
  assert.equal(page2.body.items.length, 1)
  assert.notEqual(page2.body.items[0].id, firstId)
})

test('GET /simulations/executions filtra por busca textual, status, provedor, modo, contentType e outputType com meta de paginação', async () => {
  const workspace = await createWorkspaceScenario()
  const api = request(app.getHttpServer())

  const contentPost = await createContent(api, workspace)
  const automation = await createAndPublishAutomation(api, workspace, contentPost.id, 'CUPOM')

  // 1. Execução PENDING com autor "Marcos" e texto "Quero CUPOM hoje"
  const res1 = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: contentPost.id,
    provider: 'INSTAGRAM',
    author: 'Marcos',
    text: 'Quero CUPOM hoje',
    idempotencyKey: 'filter-test-001',
    originAutomationId: automation.automationId,
  })
  expectStatus(res1, 201)

  // 2. Execução com autor "Juliana" e texto "Dúvida geral"
  const res2 = await api.post('/api/v1/simulations/comments').set(workspace.headers).send({
    contentId: contentPost.id,
    provider: 'INSTAGRAM',
    author: 'Juliana',
    text: 'Dúvida geral',
    idempotencyKey: 'filter-test-002',
    originAutomationId: automation.automationId,
  })
  expectStatus(res2, 201)

  // Processa a 1ª execução com worker para que se torne COMPLETED com outputs
  const workerRepo = new PrismaAutomationExecutionRepository(prisma)
  const workerService = new AutomationExecutionService(workerRepo)
  const job1 = queued.find((j: any) => j.executionId === res1.body.executionId)
  assert.ok(job1)
  await workerService.consume(job1 as never)

  // A. Busca textual por autor "marcos" (case-insensitive)
  const searchByAuthor = await api
    .get('/api/v1/simulations/executions?query=marcos')
    .set(workspace.headers)
  expectStatus(searchByAuthor, 200)
  assert.equal(searchByAuthor.body.items.length, 1)
  assert.equal(searchByAuthor.body.items[0].id, res1.body.executionId)
  assert.equal(searchByAuthor.body.meta.total, 1)

  // B. Busca textual por texto "dúvida" (case-insensitive)
  const searchByText = await api
    .get('/api/v1/simulations/executions?query=dúvida')
    .set(workspace.headers)
  expectStatus(searchByText, 200)
  assert.equal(searchByText.body.items.length, 1)
  assert.equal(searchByText.body.items[0].id, res2.body.executionId)

  // C. Filtro por status=COMPLETED
  const filterByStatus = await api
    .get('/api/v1/simulations/executions?status=COMPLETED')
    .set(workspace.headers)
  expectStatus(filterByStatus, 200)
  assert.equal(filterByStatus.body.items.length, 1)
  assert.equal(filterByStatus.body.items[0].id, res1.body.executionId)

  // D. Filtro por status=PENDING
  const filterByPending = await api
    .get('/api/v1/simulations/executions?status=PENDING')
    .set(workspace.headers)
  expectStatus(filterByPending, 200)
  assert.equal(filterByPending.body.items.length, 1)
  assert.equal(filterByPending.body.items[0].id, res2.body.executionId)

  // E. Filtro por provider=INSTAGRAM e mode=SIMULATED
  const filterByProviderMode = await api
    .get('/api/v1/simulations/executions?provider=INSTAGRAM&mode=SIMULATED')
    .set(workspace.headers)
  expectStatus(filterByProviderMode, 200)
  assert.equal(filterByProviderMode.body.items.length, 2)
  assert.equal(filterByProviderMode.body.meta.total, 2)
  assert.equal(filterByProviderMode.body.meta.page, 1)

  // F. Filtro por outputType=PUBLIC_REPLY
  const filterByOutput = await api
    .get('/api/v1/simulations/executions?outputType=PUBLIC_REPLY')
    .set(workspace.headers)
  expectStatus(filterByOutput, 200)
  assert.equal(filterByOutput.body.items.length, 1)
  assert.equal(filterByOutput.body.items[0].id, res1.body.executionId)
})
