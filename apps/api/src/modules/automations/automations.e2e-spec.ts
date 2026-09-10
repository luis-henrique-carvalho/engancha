import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, afterEach, before, test } from 'node:test'
import { CanActivate, ExecutionContext, Injectable, type INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { automationResponseSchema, contentResponseSchema } from '@engancha/contracts'
import request, { type Response } from 'supertest'
import type { RequestWithAuthorization } from '../../platform/security/authorization-context'
import { AuthorizationContextGuard } from '../../platform/security/authorization-context'
import { PlatformModule } from '../../platform/platform.module'
import { DatabaseModule } from '../../platform/database/database.module'
import { PrismaService } from '../../platform/database/prisma.service'
import { AutomationsModule } from './automations.module'

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
let scenario: WorkspaceScenario | undefined
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
      name: `Automation test ${suffix}`,
      email: `automation-${suffix}@example.test`,
    },
  })
  await prisma.client.organization.create({
    data: {
      id: organizationId,
      name: `Automation test ${suffix}`,
      slug: `automation-${suffix}`,
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

async function createAutomation(api: ReturnType<typeof request>, workspace: WorkspaceScenario) {
  const response = await api
    .post('/api/v1/automations')
    .set(workspace.headers)
    .send({ name: 'Comentar para receber' })
  expectStatus(response, 201)
  return response.body
}

before(async () => {
  const module = await Test.createTestingModule({
    imports: [PlatformModule, DatabaseModule, AutomationsModule],
  })
    .overrideGuard(AuthorizationContextGuard)
    .useClass(FeatureAuthorizationGuard)
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
  scenarios = []
  scenario = undefined
})

after(async () => {
  await app.close()
})

test('cria conteúdo e automação como rascunho no workspace ativo', async () => {
  scenario = await createWorkspaceScenario()
  const api = request(app.getHttpServer())

  const content = await createContent(api, scenario)
  assert.equal(content.organizationId, scenario.organizationId)
  assert.equal(contentResponseSchema.safeParse(content).success, true)

  const automation = await createAutomation(api, scenario)
  assert.equal(automationResponseSchema.safeParse(automation).success, true)
  assert.equal(automation.status, 'DRAFT')
  assert.equal(automation.current.name, 'Comentar para receber')
  assert.equal(automation.current.version, 1)
})

test('publica uma configuração válida e expõe a revisão ativa', async () => {
  scenario = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, scenario)
  const automation = await createAutomation(api, scenario)

  const draft = await api
    .patch(`/api/v1/automations/${automation.id}`)
    .set(scenario.headers)
    .send({
      targetId: content.id,
      keyword: '  CÓDIGO  ',
      actions: [
        { type: 'PUBLIC_REPLY', text: 'Enviei na DM.' },
        { type: 'CAPTURE_EMAIL', prompt: 'Qual é seu melhor e-mail?' },
      ],
    })
  expectStatus(draft, 200)
  assert.equal(draft.body.current.keyword, 'CÓDIGO')

  const published = await api
    .post(`/api/v1/automations/${automation.id}/publish`)
    .set(scenario.headers)
    .send()
  expectStatus(published, 201)
  assert.equal(published.body.status, 'ACTIVE')
  assert.equal(published.body.draft, null)
  assert.equal(published.body.published.version, 1)
  assert.equal(published.body.current.keyword, 'CÓDIGO')
})

test('preserva o snapshot publicado ao editar e pausa a projeção ativa', async () => {
  scenario = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, scenario)
  const automation = await createAutomation(api, scenario)

  const configured = await api
    .patch(`/api/v1/automations/${automation.id}`)
    .set(scenario.headers)
    .send({
      targetId: content.id,
      keyword: 'ORIGINAL',
      actions: [{ type: 'LINK', url: 'https://engancha.test/oferta' }],
    })
  expectStatus(configured, 200)

  const firstPublication = await api
    .post(`/api/v1/automations/${automation.id}/publish`)
    .set(scenario.headers)
    .send()
  expectStatus(firstPublication, 201)

  const edited = await api
    .patch(`/api/v1/automations/${automation.id}`)
    .set(scenario.headers)
    .send({ name: 'Nova campanha', keyword: 'NOVA' })
  expectStatus(edited, 200)
  assert.equal(edited.body.status, 'ACTIVE')
  assert.equal(edited.body.hasUnpublishedChanges, true)
  assert.equal(edited.body.published.version, 1)
  assert.equal(edited.body.published.keyword, 'ORIGINAL')
  assert.equal(edited.body.draft.version, 2)
  assert.equal(edited.body.draft.keyword, 'NOVA')
  assert.equal(edited.body.draft.actions[0].type, 'LINK')

  const paused = await api
    .post(`/api/v1/automations/${automation.id}/pause`)
    .set(scenario.headers)
    .send()
  expectStatus(paused, 201)
  assert.equal(paused.body.status, 'PAUSED')
  assert.equal(paused.body.published.version, 1)
  assert.equal(paused.body.draft.version, 2)

  const persisted = await prisma.client.automation.findUniqueOrThrow({
    where: { id: automation.id },
    include: { revisions: { orderBy: { version: 'asc' } } },
  })
  assert.equal(persisted.activeContentId, null)
  assert.equal(persisted.activeKeywordNormalized, null)
  assert.deepEqual(
    persisted.revisions.map((revision) => [revision.version, revision.status]),
    [
      [1, 'PUBLISHED'],
      [2, 'DRAFT'],
    ],
  )
})

test('isola conteúdos, automações e listagens por workspace', async () => {
  const first = await createWorkspaceScenario()
  const second = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const foreignContent = await createContent(api, second)
  const foreignAutomation = await createAutomation(api, second)
  const ownAutomation = await createAutomation(api, first)

  const targetFromAnotherWorkspace = await api
    .patch(`/api/v1/automations/${ownAutomation.id}`)
    .set(first.headers)
    .send({ targetId: foreignContent.id })
  expectStatus(targetFromAnotherWorkspace, 404)

  const foreignRead = await api
    .get(`/api/v1/automations/${foreignAutomation.id}`)
    .set(first.headers)
  expectStatus(foreignRead, 404)

  const listing = await api.get('/api/v1/automations').set(first.headers)
  expectStatus(listing, 200)
  assert.deepEqual(
    listing.body.items.map((automation: { id: string }) => automation.id),
    [ownAutomation.id],
  )
})

test('aceita apenas uma publicação concorrente para o mesmo conteúdo e palavra-chave', async () => {
  scenario = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, scenario)
  const first = await createAutomation(api, scenario)
  const second = await createAutomation(api, scenario)

  for (const automation of [first, second]) {
    const configured = await api
      .patch(`/api/v1/automations/${automation.id}`)
      .set(scenario.headers)
      .send({
        targetId: content.id,
        keyword: 'Cupom Especial',
        actions: [{ type: 'LINK', url: 'https://engancha.test/cupom' }],
      })
    expectStatus(configured, 200)
  }

  const publications = await Promise.all(
    [first, second].map((automation) =>
      api.post(`/api/v1/automations/${automation.id}/publish`).set(scenario!.headers).send(),
    ),
  )
  assert.deepEqual(publications.map((response) => response.status).sort(), [201, 409])
  assert.equal(
    await prisma.client.automation.count({
      where: {
        organizationId: scenario.organizationId,
        status: 'ACTIVE',
        activeContentId: content.id,
        activeKeywordNormalized: 'cupom especial',
      },
    }),
    1,
  )
})

test('concentra edições concorrentes de uma automação ativa em um único rascunho', async () => {
  scenario = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, scenario)
  const automation = await createAutomation(api, scenario)

  const configured = await api
    .patch(`/api/v1/automations/${automation.id}`)
    .set(scenario.headers)
    .send({
      targetId: content.id,
      keyword: 'ANTIGO',
      actions: [{ type: 'LINK', url: 'https://engancha.test/oferta' }],
    })
  expectStatus(configured, 200)
  const published = await api
    .post(`/api/v1/automations/${automation.id}/publish`)
    .set(scenario.headers)
    .send()
  expectStatus(published, 201)

  const edits = await Promise.all(
    ['Primeira edição', 'Segunda edição'].map((name) =>
      api.patch(`/api/v1/automations/${automation.id}`).set(scenario!.headers).send({ name }),
    ),
  )
  assert.deepEqual(edits.map((response) => response.status).sort(), [200, 200])
  assert.equal(
    await prisma.client.automationRevision.count({
      where: { automationId: automation.id, status: 'DRAFT' },
    }),
    1,
  )
})

test('retorna erros de contrato para publicação incompleta e ação não suportada', async () => {
  scenario = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const automation = await createAutomation(api, scenario)

  const incompletePublication = await api
    .post(`/api/v1/automations/${automation.id}/publish`)
    .set(scenario.headers)
    .send()
  expectStatus(incompletePublication, 422)
  assert.equal(incompletePublication.body.code, 'AUTOMATION_NOT_PUBLISHABLE')
  assert.deepEqual(incompletePublication.body.issues.sort(), ['actions', 'keyword', 'targetId'])

  const invalidAction = await api
    .patch(`/api/v1/automations/${automation.id}`)
    .set(scenario.headers)
    .send({ actions: [{ type: 'APPLY_TAG', tag: 'lead' }] })
  expectStatus(invalidAction, 400)
  assert.equal(invalidAction.body.code, 'VALIDATION_FAILED')
  assert.equal(invalidAction.body.issues[0].path, 'actions.0.type')
})

test('rejeita publicação cuja ação final não seja terminal', async () => {
  scenario = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, scenario)
  const automation = await createAutomation(api, scenario)

  const configured = await api
    .patch(`/api/v1/automations/${automation.id}`)
    .set(scenario.headers)
    .send({
      targetId: content.id,
      keyword: 'CUPOM',
      actions: [
        { type: 'LINK', url: 'https://engancha.test/cupom' },
        { type: 'PUBLIC_REPLY', text: 'Enviei na DM.' },
      ],
    })
  expectStatus(configured, 200)

  const publication = await api
    .post(`/api/v1/automations/${automation.id}/publish`)
    .set(scenario.headers)
    .send()
  expectStatus(publication, 422)
  assert.deepEqual(publication.body.issues, ['actions'])
})

test('filtra automações por status via GET /automations?status=ACTIVE', async () => {
  scenario = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, scenario)

  const draft = await createAutomation(api, scenario)

  const toPublish = await createAutomation(api, scenario)
  const configured = await api
    .patch(`/api/v1/automations/${toPublish.id}`)
    .set(scenario.headers)
    .send({
      targetId: content.id,
      keyword: 'PROMO',
      actions: [{ type: 'LINK', url: 'https://engancha.test/promo' }],
    })
  expectStatus(configured, 200)
  const published = await api
    .post(`/api/v1/automations/${toPublish.id}/publish`)
    .set(scenario.headers)
    .send()
  expectStatus(published, 201)

  const activeOnly = await api.get('/api/v1/automations?status=ACTIVE').set(scenario.headers)
  expectStatus(activeOnly, 200)
  assert.equal(activeOnly.body.meta.total, 1)
  assert.equal(activeOnly.body.items[0].id, toPublish.id)
  assert.equal(activeOnly.body.items[0].status, 'ACTIVE')

  const draftOnly = await api.get('/api/v1/automations?status=DRAFT').set(scenario.headers)
  expectStatus(draftOnly, 200)
  assert.equal(draftOnly.body.meta.total, 1)
  assert.equal(draftOnly.body.items[0].id, draft.id)

  const all = await api.get('/api/v1/automations').set(scenario.headers)
  expectStatus(all, 200)
  assert.equal(all.body.meta.total, 2)
})

test('filtra automações por nome via GET /automations?query=BUSCA', async () => {
  scenario = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, scenario)

  const namedOne = await api
    .post('/api/v1/automations')
    .set(scenario.headers)
    .send({ name: 'Campanha Verão' })
  expectStatus(namedOne, 201)

  const namedTwo = await api
    .post('/api/v1/automations')
    .set(scenario.headers)
    .send({ name: 'Campanha Inverno' })
  expectStatus(namedTwo, 201)

  // Create one with keyword to test keyword search
  const keywordOne = await api
    .post('/api/v1/automations')
    .set(scenario.headers)
    .send({ name: 'Outra' })
  expectStatus(keywordOne, 201)
  const patched = await api
    .patch(`/api/v1/automations/${keywordOne.body.id}`)
    .set(scenario.headers)
    .send({
      targetId: content.id,
      keyword: 'cupom-especial',
      actions: [{ type: 'LINK', url: 'https://engancha.test/cupom' }],
    })
  expectStatus(patched, 200)

  const byName = await api.get('/api/v1/automations?query=Verão').set(scenario.headers)
  expectStatus(byName, 200)
  assert.equal(byName.body.meta.total, 1)
  assert.equal(byName.body.items[0].id, namedOne.body.id)

  const byKeyword = await api.get('/api/v1/automations?query=cupom').set(scenario.headers)
  expectStatus(byKeyword, 200)
  assert.equal(byKeyword.body.meta.total, 1)
  assert.equal(byKeyword.body.items[0].id, keywordOne.body.id)

  const noMatch = await api.get('/api/v1/automations?query=inexistente').set(scenario.headers)
  expectStatus(noMatch, 200)
  assert.equal(noMatch.body.meta.total, 0)
})

test('calcula contagem real de execuções na listagem e detalhe da automação', async () => {
  scenario = await createWorkspaceScenario()
  const api = request(app.getHttpServer())
  const content = await createContent(api, scenario)

  const created = await createAutomation(api, scenario)

  const initialGet = await api.get(`/api/v1/automations/${created.id}`).set(scenario.headers)
  expectStatus(initialGet, 200)
  assert.equal(initialGet.body.executionCount, 0)

  await prisma.client.automationExecution.create({
    data: {
      organizationId: scenario.organizationId,
      contentId: content.id,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      idempotencyKey: randomUUID(),
      inputAuthor: 'test_user',
      inputText: 'comentário de teste',
      automationId: created.id,
      matched: true,
      status: 'COMPLETED',
    },
  })

  const afterExecution = await api.get(`/api/v1/automations/${created.id}`).set(scenario.headers)
  expectStatus(afterExecution, 200)
  assert.equal(afterExecution.body.executionCount, 1)

  const list = await api.get('/api/v1/automations').set(scenario.headers)
  expectStatus(list, 200)
  const item = list.body.items.find((auto: any) => auto.id === created.id)
  assert.ok(item)
  assert.equal(item.executionCount, 1)
})
