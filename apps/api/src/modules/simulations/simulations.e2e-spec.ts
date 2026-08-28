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
import { AutomationExecutionService } from '../../../../worker/src/automation-execution/application/automation-execution.service'
import { PrismaAutomationExecutionRepository } from '../../../../worker/src/automation-execution/infrastructure/persistence/prisma-automation-execution.repository'

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

