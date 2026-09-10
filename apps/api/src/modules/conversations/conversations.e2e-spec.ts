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
