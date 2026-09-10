import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, afterEach, before, test } from 'node:test'
import { CanActivate, ExecutionContext, Injectable, type INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request, { type Response } from 'supertest'
import type { RequestWithAuthorization } from '../../platform/security/authorization-context'
import { AuthorizationContextGuard } from '../../platform/security/authorization-context'
import { PlatformModule } from '../../platform/platform.module'
import { DatabaseModule } from '../../platform/database/database.module'
import { PrismaService } from '../../platform/database/prisma.service'
import { ConversationsModule } from './conversations.module'
import { EMAIL_CAPTURE_DISPATCHER } from './domain/ports/email-capture-dispatcher.port'

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
      name: `User ${suffix}`,
      email: `user-${suffix}@example.test`,
      emailVerified: true,
    },
  })

  await prisma.client.organization.create({
    data: {
      id: organizationId,
      name: `Org ${suffix}`,
      slug: `org-${suffix}`,
    },
  })

  await prisma.client.member.create({
    data: {
      id: membershipId,
      organizationId,
      userId,
      role: 'member',
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

before(async () => {
  const module = await Test.createTestingModule({
    imports: [PlatformModule, DatabaseModule, ConversationsModule],
  })
    .overrideGuard(AuthorizationContextGuard)
    .useClass(FeatureAuthorizationGuard)
    .overrideProvider(EMAIL_CAPTURE_DISPATCHER)
    .useValue({ dispatch: async () => {} })
    .compile()

  app = module.createNestApplication({ logger: false })
  app.setGlobalPrefix('api/v1')
  await app.init()
  prisma = module.get(PrismaService)
})

afterEach(async () => {
  await Promise.all(
    scenarios.map(async (ws) => {
      await prisma.client.emailCaptureRequest.deleteMany({
        where: { organizationId: ws.organizationId },
      })
      await prisma.client.message.deleteMany({ where: { organizationId: ws.organizationId } })
      await prisma.client.lead.deleteMany({ where: { organizationId: ws.organizationId } })
      await prisma.client.contactTag.deleteMany({
        where: { contact: { organizationId: ws.organizationId } },
      })
      await prisma.client.tag.deleteMany({ where: { organizationId: ws.organizationId } })
      await prisma.client.conversation.deleteMany({ where: { organizationId: ws.organizationId } })
      await prisma.client.contact.deleteMany({ where: { organizationId: ws.organizationId } })
      await prisma.client.member.deleteMany({ where: { organizationId: ws.organizationId } })
      await prisma.client.organization.delete({ where: { id: ws.organizationId } })
      await prisma.client.user.delete({ where: { id: ws.userId } })
    }),
  )
  scenarios = []
})

after(async () => {
  await app.close()
})

test('GET /api/v1/conversations lista conversas paginadas por cursor e isola workspaces', async () => {
  const ws1 = await createWorkspaceScenario()
  const ws2 = await createWorkspaceScenario()

  // Cria contatos e conversas no ws1
  const contact1 = await prisma.client.contact.create({
    data: {
      organizationId: ws1.organizationId,
      username: 'follower_one',
      name: 'Follower One',
      email: 'follower1@test.com',
      emailNormalized: 'follower1@test.com',
    },
  })

  const conv1 = await prisma.client.conversation.create({
    data: {
      organizationId: ws1.organizationId,
      contactId: contact1.id,
      lastMessageAt: new Date('2026-09-10T10:00:00Z'),
    },
  })

  await prisma.client.message.create({
    data: {
      organizationId: ws1.organizationId,
      conversationId: conv1.id,
      direction: 'INBOUND',
      type: 'COMMENT',
      text: 'Quero o link agora',
    },
  })

  // Conversa no ws2 (não deve aparecer para ws1)
  const contact2 = await prisma.client.contact.create({
    data: {
      organizationId: ws2.organizationId,
      username: 'follower_two',
      name: 'Follower Two',
    },
  })
  await prisma.client.conversation.create({
    data: {
      organizationId: ws2.organizationId,
      contactId: contact2.id,
      lastMessageAt: new Date('2026-09-10T11:00:00Z'),
    },
  })

  const api = request(app.getHttpServer())

  // Consulta ws1
  const res1 = await api.get('/api/v1/conversations').set(ws1.headers)

  expectStatus(res1, 200)
  assert.equal(res1.body.items.length, 1)
  assert.equal(res1.body.items[0].id, conv1.id)
  assert.equal(res1.body.items[0].contact.username, 'follower_one')
  assert.equal(res1.body.meta.page, 1)
  assert.equal(res1.body.meta.total, 1)
  assert.equal(res1.body.meta.totalPages, 1)

  // Busca textual
  const searchRes = await api.get('/api/v1/conversations?query=follower_one').set(ws1.headers)
  expectStatus(searchRes, 200)
  assert.equal(searchRes.body.items.length, 1)

  const searchEmpty = await api.get('/api/v1/conversations?query=non_existent').set(ws1.headers)
  expectStatus(searchEmpty, 200)
  assert.equal(searchEmpty.body.items.length, 0)
})

test('GET /api/v1/conversations/:id retorna histórico e 404 para foreign workspace', async () => {
  const ws1 = await createWorkspaceScenario()
  const ws2 = await createWorkspaceScenario()

  const contact = await prisma.client.contact.create({
    data: {
      organizationId: ws1.organizationId,
      username: 'carlos',
      name: 'Carlos Silva',
    },
  })

  const conv = await prisma.client.conversation.create({
    data: {
      organizationId: ws1.organizationId,
      contactId: contact.id,
    },
  })

  await prisma.client.message.create({
    data: {
      organizationId: ws1.organizationId,
      conversationId: conv.id,
      direction: 'INBOUND',
      type: 'COMMENT',
      text: 'Olá Engancha',
    },
  })

  const api = request(app.getHttpServer())

  // Sucesso no ws1
  const resSuccess = await api.get(`/api/v1/conversations/${conv.id}`).set(ws1.headers)
  expectStatus(resSuccess, 200)
  assert.equal(resSuccess.body.id, conv.id)
  assert.equal(resSuccess.body.contact.username, 'carlos')
  assert.equal(resSuccess.body.messages.length, 1)
  assert.equal(resSuccess.body.messages[0].text, 'Olá Engancha')

  // 404 no ws2
  const resForbidden = await api.get(`/api/v1/conversations/${conv.id}`).set(ws2.headers)
  expectStatus(resForbidden, 404)
})

test('GET /api/v1/conversations e /:id retornam o nome da automação vinculada', async () => {
  const ws1 = await createWorkspaceScenario()

  const automation = await prisma.client.automation.create({
    data: {
      organizationId: ws1.organizationId,
      createdByUserId: ws1.userId,
      status: 'ACTIVE',
    },
  })

  const rev = await prisma.client.automationRevision.create({
    data: {
      automationId: automation.id,
      version: 1,
      name: 'Automação Black Friday',
      status: 'PUBLISHED',
    },
  })

  await prisma.client.automation.update({
    where: { id: automation.id },
    data: { currentPublishedRevisionId: rev.id },
  })

  const contact = await prisma.client.contact.create({
    data: {
      organizationId: ws1.organizationId,
      username: 'comprador_bf',
      name: 'Comprador BF',
    },
  })

  const conv = await prisma.client.conversation.create({
    data: {
      organizationId: ws1.organizationId,
      contactId: contact.id,
      lastMessageAt: new Date('2026-09-10T12:00:00Z'),
    },
  })

  const content = await prisma.client.content.create({
    data: {
      organizationId: ws1.organizationId,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      contentType: 'POST',
      title: 'Post BF',
      externalContentId: randomUUID(),
    },
  })

  await prisma.client.automationExecution.create({
    data: {
      organizationId: ws1.organizationId,
      automationId: automation.id,
      conversationId: conv.id,
      contactId: contact.id,
      contentId: content.id,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      idempotencyKey: randomUUID(),
      inputAuthor: '@comprador_bf',
      inputText: 'Quero comprar',
      commentId: randomUUID(),
      status: 'COMPLETED',
      matched: true,
    },
  })

  const api = request(app.getHttpServer())

  const resList = await api.get('/api/v1/conversations').set(ws1.headers)
  expectStatus(resList, 200)
  assert.equal(resList.body.items.length, 1)
  assert.equal(resList.body.items[0].automation?.id, automation.id)
  assert.equal(resList.body.items[0].automation?.name, 'Automação Black Friday')

  const resDetail = await api.get(`/api/v1/conversations/${conv.id}`).set(ws1.headers)
  expectStatus(resDetail, 200)
  assert.equal(resDetail.body.automation?.id, automation.id)
  assert.equal(resDetail.body.automation?.name, 'Automação Black Friday')
})

test('GET /api/v1/contacts lista contatos e filtra por leadState', async () => {
  const ws1 = await createWorkspaceScenario()

  const contactWithLead = await prisma.client.contact.create({
    data: {
      organizationId: ws1.organizationId,
      username: 'lead_user',
      name: 'Lead User',
      email: 'lead@test.com',
      emailNormalized: 'lead@test.com',
      lastInteractionAt: new Date('2026-09-10T12:00:00Z'),
    },
  })

  await prisma.client.lead.create({
    data: {
      organizationId: ws1.organizationId,
      contactId: contactWithLead.id,
      capturedAt: new Date('2026-09-10T12:00:00Z'),
    },
  })

  await prisma.client.contact.create({
    data: {
      organizationId: ws1.organizationId,
      username: 'no_lead',
      name: 'No Lead',
      lastInteractionAt: new Date('2026-09-10T11:00:00Z'),
    },
  })

  const api = request(app.getHttpServer())

  // Listagem geral
  const resAll = await api.get('/api/v1/contacts').set(ws1.headers)
  expectStatus(resAll, 200)
  assert.equal(resAll.body.items.length, 2)

  // Filtro LEAD
  const resLead = await api.get('/api/v1/contacts?leadState=LEAD').set(ws1.headers)
  expectStatus(resLead, 200)
  assert.equal(resLead.body.items.length, 1)
  assert.equal(resLead.body.items[0].username, 'lead_user')
  assert.equal(resLead.body.items[0].isLead, true)

  // Filtro NOT_LEAD
  const resNotLead = await api.get('/api/v1/contacts?leadState=NOT_LEAD').set(ws1.headers)
  expectStatus(resNotLead, 200)
  assert.equal(resNotLead.body.items.length, 1)
  assert.equal(resNotLead.body.items[0].username, 'no_lead')
  assert.equal(resNotLead.body.items[0].isLead, false)
})

test('GET /api/v1/leads lista leads com cursor opaco, filtros e isolamento multi-tenant', async () => {
  const ws1 = await createWorkspaceScenario()
  const ws2 = await createWorkspaceScenario()

  // Automation e Tag no ws1
  const tag1 = await prisma.client.tag.create({
    data: {
      organizationId: ws1.organizationId,
      name: 'E-book VIP',
      normalizedName: 'e-book vip',
    },
  })

  const automation1 = await prisma.client.automation.create({
    data: {
      organizationId: ws1.organizationId,
      createdByUserId: ws1.userId,
      status: 'ACTIVE',
    },
  })

  const rev1 = await prisma.client.automationRevision.create({
    data: {
      automationId: automation1.id,
      version: 1,
      name: 'Automação de Captura 1',
      status: 'PUBLISHED',
    },
  })

  await prisma.client.automation.update({
    where: { id: automation1.id },
    data: { currentPublishedRevisionId: rev1.id },
  })

  // Contato 1 com lead e tag
  const contact1 = await prisma.client.contact.create({
    data: {
      organizationId: ws1.organizationId,
      username: 'lead_alpha',
      name: 'Alpha Lead',
      email: 'alpha@test.com',
      emailNormalized: 'alpha@test.com',
      lastInteractionAt: new Date('2026-09-10T12:00:00Z'),
    },
  })

  await prisma.client.contactTag.create({
    data: {
      contactId: contact1.id,
      tagId: tag1.id,
    },
  })

  const lead1 = await prisma.client.lead.create({
    data: {
      organizationId: ws1.organizationId,
      contactId: contact1.id,
      automationId: automation1.id,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      capturedAt: new Date('2026-09-10T12:30:00Z'),
    },
  })

  // Contato 2 com lead mais antigo
  const contact2 = await prisma.client.contact.create({
    data: {
      organizationId: ws1.organizationId,
      username: 'lead_beta',
      name: 'Beta Lead',
      email: 'beta@test.com',
      emailNormalized: 'beta@test.com',
      lastInteractionAt: new Date('2026-09-10T11:00:00Z'),
    },
  })

  const lead2 = await prisma.client.lead.create({
    data: {
      organizationId: ws1.organizationId,
      contactId: contact2.id,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      capturedAt: new Date('2026-09-10T11:00:00Z'),
    },
  })

  // Contato e Lead no ws2 (isolamento)
  const contactWs2 = await prisma.client.contact.create({
    data: {
      organizationId: ws2.organizationId,
      username: 'foreign_lead',
      name: 'Foreign Lead',
      email: 'foreign@test.com',
      emailNormalized: 'foreign@test.com',
    },
  })

  await prisma.client.lead.create({
    data: {
      organizationId: ws2.organizationId,
      contactId: contactWs2.id,
      capturedAt: new Date('2026-09-10T12:45:00Z'),
    },
  })

  const api = request(app.getHttpServer())

  // 1. Listagem completa no ws1: ordenado por capturedAt desc (lead1 depois lead2), 2 itens
  const resWs1 = await api.get('/api/v1/leads').set(ws1.headers)
  expectStatus(resWs1, 200)
  assert.equal(resWs1.body.items.length, 2)
  assert.equal(resWs1.body.items[0].id, lead1.id)
  assert.equal(resWs1.body.items[0].contact.username, 'lead_alpha')
  assert.equal(resWs1.body.items[0].contact.email, 'alpha@test.com')
  assert.equal(resWs1.body.items[0].automation?.name, 'Automação de Captura 1')
  assert.equal(resWs1.body.items[0].tags.length, 1)
  assert.equal(resWs1.body.items[0].tags[0].name, 'E-book VIP')
  assert.equal(resWs1.body.items[1].id, lead2.id)
  assert.equal(resWs1.body.meta.hasNextPage, false)
  assert.equal(resWs1.body.meta.nextCursor, null)
  assert.equal(resWs1.body.meta.total, 2)

  // 2. Paginação com cursor: limit=1
  const resPage1 = await api.get('/api/v1/leads?limit=1').set(ws1.headers)
  expectStatus(resPage1, 200)
  assert.equal(resPage1.body.items.length, 1)
  assert.equal(resPage1.body.items[0].id, lead1.id)
  assert.equal(resPage1.body.meta.hasNextPage, true)
  assert.ok(resPage1.body.meta.nextCursor)

  // Próxima página usando cursor
  const resPage2 = await api
    .get(`/api/v1/leads?limit=1&cursor=${encodeURIComponent(resPage1.body.meta.nextCursor)}`)
    .set(ws1.headers)
  expectStatus(resPage2, 200)
  assert.equal(resPage2.body.items.length, 1)
  assert.equal(resPage2.body.items[0].id, lead2.id)
  assert.equal(resPage2.body.meta.hasNextPage, false)
  assert.equal(resPage2.body.meta.nextCursor, null)

  // 3. Filtro por tagId
  const resTag = await api.get(`/api/v1/leads?tagId=${tag1.id}`).set(ws1.headers)
  expectStatus(resTag, 200)
  assert.equal(resTag.body.items.length, 1)
  assert.equal(resTag.body.items[0].id, lead1.id)

  // 4. Filtro por automationId
  const resAuto = await api.get(`/api/v1/leads?automationId=${automation1.id}`).set(ws1.headers)
  expectStatus(resAuto, 200)
  assert.equal(resAuto.body.items.length, 1)
  assert.equal(resAuto.body.items[0].id, lead1.id)

  // 5. Busca textual por e-mail ou nome
  const resSearch = await api.get('/api/v1/leads?query=beta').set(ws1.headers)
  expectStatus(resSearch, 200)
  assert.equal(resSearch.body.items.length, 1)
  assert.equal(resSearch.body.items[0].id, lead2.id)

  // 6. Isolamento multi-tenant: ws2 só enxerga o lead do ws2
  const resWs2 = await api.get('/api/v1/leads').set(ws2.headers)
  expectStatus(resWs2, 200)
  assert.equal(resWs2.body.items.length, 1)
  assert.equal(resWs2.body.items[0].contact.username, 'foreign_lead')

  // 7. Usar tagId ou automationId de outro workspace no ws2 não retorna leads
  const resForeign = await api.get(`/api/v1/leads?tagId=${tag1.id}`).set(ws2.headers)
  expectStatus(resForeign, 200)
  assert.equal(resForeign.body.items.length, 0)
})
