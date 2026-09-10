import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deterministicCommentMessageExternalId,
  normalizeContactExternalUserId,
  normalizeContactUsername,
} from '@engancha/contracts'
import { AutomationExecutionService } from '../apps/worker/src/automation-execution/application/automation-execution.service.ts'
import { PrismaAutomationExecutionRepository } from '../apps/worker/src/automation-execution/infrastructure/persistence/prisma-automation-execution.repository.ts'
import { prisma } from '../apps/api/src/platform/database/client.ts'

test('normalizeContactExternalUserId remove arroba, espaços e converte para minúsculas', () => {
  assert.equal(normalizeContactExternalUserId('@Maria_Silva'), 'maria_silva')
  assert.equal(normalizeContactExternalUserId('  @Carlos.Dev  '), 'carlos.dev')
  assert.equal(normalizeContactExternalUserId('usuario'), 'usuario')
  assert.equal(normalizeContactExternalUserId('@@@DuploArroba'), 'duploarroba')
})

test('normalizeContactUsername remove arroba e preserva o casing original do handle', () => {
  assert.equal(normalizeContactUsername('@Maria_Silva'), 'Maria_Silva')
  assert.equal(normalizeContactUsername('  @Carlos.Dev  '), 'Carlos.Dev')
  assert.equal(normalizeContactUsername('usuario'), 'usuario')
})

test('deterministicCommentMessageExternalId gera chave determinística baseada na execução', () => {
  assert.equal(deterministicCommentMessageExternalId('exec-123'), 'execution:exec-123:comment')
})

test('AutomationExecutionService propaga contactId e conversationId ao concluir', async () => {
  let savedCompletedParams = null
  const repository = {
    claimExecution: async (executionId, organizationId) => ({
      id: executionId,
      organizationId,
      contentId: 'content-1',
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      inputText: 'Quero o material',
      inputAuthor: '@Lucas',
      commentId: 'comment-1',
      originAutomationId: null,
      status: 'PROCESSING',
      attempts: 1,
      stateVersion: 2,
    }),
    findActiveCandidateAutomations: async () => [
      {
        id: 'auto-1',
        organizationId: 'org-1',
        status: 'ACTIVE',
        currentPublishedRevision: {
          id: 'rev-1',
          version: 1,
          target: { id: 'target-1', contentId: 'content-1' },
          trigger: {
            id: 'trig-1',
            type: 'COMMENT_KEYWORD',
            keyword: 'Material',
            keywordNormalized: 'material',
          },
          actions: [{ id: 'act-1', position: 0, type: 'PUBLIC_REPLY', config: { text: 'Olá!' } }],
        },
      },
    ],
    saveExecutionCompleted: async (params) => {
      savedCompletedParams = params
      return { contactId: 'contact-123', conversationId: 'conversation-456' }
    },
    markIgnored: async () => {},
    markFailed: async () => {},
  }

  const service = new AutomationExecutionService(repository)
  const result = await service.consume({
    type: 'automation.execution.requested.v1',
    version: 'v1',
    correlationId: 'sim-001',
    executionId: 'exec-100',
    organizationId: 'org-1',
  })

  assert.deepEqual(result, {
    executionId: 'exec-100',
    status: 'COMPLETED',
    matched: true,
    automationId: 'auto-1',
    revisionId: 'rev-1',
    contactId: 'contact-123',
    conversationId: 'conversation-456',
  })
  assert.equal(savedCompletedParams.executionId, 'exec-100')
})

const prismaService = { client: prisma }
const dbRepository = new PrismaAutomationExecutionRepository(prismaService)

const timestamp = Date.now()
const orgA = `org-test-c001-a-${timestamp}`
const orgB = `org-test-c001-b-${timestamp}`
const contentA = `content-c001-a-${timestamp}`
const contentB = `content-c001-b-${timestamp}`
const autoA = `auto-c001-a-${timestamp}`
const autoRevA = `rev-c001-a-${timestamp}`
const userA = `user-c001-${timestamp}`

test('PostgreSQL: comentário cria contato, conversa e mensagem de entrada idempotentes', async () => {
  await prisma.organization.createMany({
    data: [
      { id: orgA, name: 'Org A', slug: `org-a-${timestamp}` },
      { id: orgB, name: 'Org B', slug: `org-b-${timestamp}` },
    ],
  })

  await prisma.user.create({
    data: {
      id: userA,
      name: 'User A',
      email: `user-a-${timestamp}@example.test`,
    },
  })

  await prisma.content.createMany({
    data: [
      {
        id: contentA,
        organizationId: orgA,
        provider: 'INSTAGRAM',
        mode: 'SIMULATED',
        contentType: 'POST',
        title: 'Post A',
        externalContentId: `ext-a-${timestamp}`,
      },
      {
        id: contentB,
        organizationId: orgB,
        provider: 'INSTAGRAM',
        mode: 'SIMULATED',
        contentType: 'POST',
        title: 'Post B',
        externalContentId: `ext-b-${timestamp}`,
      },
    ],
  })

  await prisma.automation.create({
    data: {
      id: autoA,
      organizationId: orgA,
      createdByUserId: userA,
      status: 'ACTIVE',
    },
  })

  await prisma.automationRevision.create({
    data: {
      id: autoRevA,
      automationId: autoA,
      version: 1,
      status: 'PUBLISHED',
      target: {
        create: {
          contentId: contentA,
        },
      },
      trigger: {
        create: {
          type: 'COMMENT_KEYWORD',
          keyword: 'Quero',
          keywordNormalized: 'quero',
        },
      },
      actions: {
        create: [{ position: 0, type: 'PUBLIC_REPLY', config: { text: 'Oi!' } }],
      },
    },
  })

  await prisma.automation.update({
    where: { id: autoA },
    data: { currentPublishedRevisionId: autoRevA },
  })

  // 1. Primeira execução: @Maria_Dev comenta em Org A
  const exec1Id = `exec-1-${timestamp}`
  await prisma.automationExecution.create({
    data: {
      id: exec1Id,
      organizationId: orgA,
      contentId: contentA,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      idempotencyKey: `idem-1-${timestamp}`,
      inputAuthor: '@Maria_Dev',
      inputText: 'Eu quero o material!',
      commentId: `comment-1-${timestamp}`,
      status: 'PROCESSING',
      attempts: 1,
    },
  })

  const snapshot1 = {
    automationId: autoA,
    revisionId: autoRevA,
    version: 1,
    target: { contentId: contentA },
    trigger: { type: 'COMMENT_KEYWORD', keyword: 'Quero', keywordNormalized: 'quero' },
    actions: [{ position: 0, type: 'PUBLIC_REPLY', config: { text: 'Oi!' } }],
  }

  const outputs1 = [
    {
      key: `${exec1Id}:0:PUBLIC_REPLY`,
      position: 0,
      type: 'PUBLIC_REPLY',
      payload: { text: 'Oi!', simulated: true },
    },
  ]

  const saved1 = await dbRepository.saveExecutionCompleted({
    executionId: exec1Id,
    organizationId: orgA,
    automationId: autoA,
    revisionId: autoRevA,
    snapshot: snapshot1,
    outputs: outputs1,
  })

  assert.ok(saved1.contactId, 'contactId deve existir')
  assert.ok(saved1.conversationId, 'conversationId deve existir')

  // Verifica persistência de Contact
  const contact1 = await prisma.contact.findUniqueOrThrow({
    where: { id: saved1.contactId },
  })
  assert.equal(contact1.organizationId, orgA)
  assert.equal(contact1.provider, 'INSTAGRAM')
  assert.equal(contact1.mode, 'SIMULATED')
  assert.equal(contact1.channelConnectionId, null)
  assert.equal(contact1.externalUserId, 'maria_dev')
  assert.equal(contact1.username, 'Maria_Dev')
  assert.equal(contact1.name, 'Maria_Dev')
  assert.equal(contact1.email, null)
  assert.ok(contact1.lastInteractionAt instanceof Date)

  // Verifica persistência de Conversation
  const conversation1 = await prisma.conversation.findUniqueOrThrow({
    where: { id: saved1.conversationId },
  })
  assert.equal(conversation1.organizationId, orgA)
  assert.equal(conversation1.contactId, contact1.id)
  assert.equal(conversation1.provider, 'INSTAGRAM')
  assert.equal(conversation1.mode, 'SIMULATED')
  assert.equal(conversation1.channelConnectionId, null)
  assert.equal(conversation1.status, 'OPEN')
  assert.ok(conversation1.lastMessageAt instanceof Date)

  // Verifica persistência de Message
  const messages1 = await prisma.message.findMany({
    where: { conversationId: conversation1.id },
  })
  assert.equal(messages1.length, 1)
  assert.equal(messages1[0].organizationId, orgA)
  assert.equal(messages1[0].executionId, exec1Id)
  assert.equal(messages1[0].direction, 'INBOUND')
  assert.equal(messages1[0].type, 'COMMENT')
  assert.equal(messages1[0].provider, 'INSTAGRAM')
  assert.equal(messages1[0].mode, 'SIMULATED')
  assert.equal(messages1[0].externalId, `execution:${exec1Id}:comment`)
  assert.equal(messages1[0].text, 'Eu quero o material!')
  assert.equal(messages1[0].status, 'RECEIVED')

  // Verifica vínculo na AutomationExecution
  const updatedExec1 = await prisma.automationExecution.findUniqueOrThrow({
    where: { id: exec1Id },
  })
  assert.equal(updatedExec1.status, 'COMPLETED')
  assert.equal(updatedExec1.contactId, contact1.id)
  assert.equal(updatedExec1.conversationId, conversation1.id)
  assert.equal(updatedExec1.inputAuthor, '@Maria_Dev')
  assert.equal(updatedExec1.inputText, 'Eu quero o material!')

  // 2. Segunda interação: maria_dev comenta novamente (mesmo autor com formato diferente)
  const exec2Id = `exec-2-${timestamp}`
  await prisma.automationExecution.create({
    data: {
      id: exec2Id,
      organizationId: orgA,
      contentId: contentA,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      idempotencyKey: `idem-2-${timestamp}`,
      inputAuthor: 'maria_dev',
      inputText: 'Quero novamente!',
      commentId: `comment-2-${timestamp}`,
      status: 'PROCESSING',
      attempts: 1,
    },
  })

  const saved2 = await dbRepository.saveExecutionCompleted({
    executionId: exec2Id,
    organizationId: orgA,
    automationId: autoA,
    revisionId: autoRevA,
    snapshot: snapshot1,
    outputs: outputs1,
  })

  // DEVE reutilizar o mesmo contato e a mesma conversa
  assert.equal(saved2.contactId, contact1.id, 'Deve reutilizar o mesmo Contact')
  assert.equal(saved2.conversationId, conversation1.id, 'Deve reutilizar a mesma Conversation')

  const contactAfter2 = await prisma.contact.findUniqueOrThrow({
    where: { id: contact1.id },
  })
  assert.ok(contactAfter2.lastInteractionAt >= contact1.lastInteractionAt)

  // Deve haver duas mensagens na conversa agora
  const messagesAfter2 = await prisma.message.findMany({
    where: { conversationId: conversation1.id },
    orderBy: { createdAt: 'asc' },
  })
  assert.equal(messagesAfter2.length, 2)
  assert.equal(messagesAfter2[1].executionId, exec2Id)
  assert.equal(messagesAfter2[1].text, 'Quero novamente!')

  // 3. Retry / Redelivery da mesma execução: NUNCA duplica contato, conversa ou mensagem
  const savedRetry = await dbRepository.saveExecutionCompleted({
    executionId: exec1Id,
    organizationId: orgA,
    automationId: autoA,
    revisionId: autoRevA,
    snapshot: snapshot1,
    outputs: outputs1,
  })

  assert.equal(savedRetry.contactId, contact1.id)
  assert.equal(savedRetry.conversationId, conversation1.id)

  const messagesForExec1 = await prisma.message.findMany({
    where: { executionId: exec1Id },
  })
  assert.equal(messagesForExec1.length, 1, 'Retry não pode criar duplicatas de mensagem')

  const totalContactsInOrgA = await prisma.contact.count({
    where: { organizationId: orgA },
  })
  assert.equal(totalContactsInOrgA, 1, 'Não deve criar contatos duplicados')

  const totalConversationsInOrgA = await prisma.conversation.count({
    where: { organizationId: orgA },
  })
  assert.equal(totalConversationsInOrgA, 1, 'Não deve criar conversas duplicadas')

  // 4. Isolamento multi-tenant: mesmo autor em Org B
  const execBId = `exec-b-${timestamp}`
  await prisma.automationExecution.create({
    data: {
      id: execBId,
      organizationId: orgB,
      contentId: contentB,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      idempotencyKey: `idem-b-${timestamp}`,
      inputAuthor: '@Maria_Dev',
      inputText: 'Quero em Org B',
      status: 'PROCESSING',
      attempts: 1,
    },
  })

  const savedB = await dbRepository.saveExecutionCompleted({
    executionId: execBId,
    organizationId: orgB,
    automationId: autoA,
    revisionId: autoRevA,
    snapshot: snapshot1,
    outputs: outputs1,
  })

  assert.notEqual(savedB.contactId, contact1.id, 'Org B deve ter contato isolado')
  assert.notEqual(savedB.conversationId, conversation1.id, 'Org B deve ter conversa isolada')

  const contactB = await prisma.contact.findUniqueOrThrow({
    where: { id: savedB.contactId },
  })
  assert.equal(contactB.organizationId, orgB)
  assert.equal(contactB.externalUserId, 'maria_dev')

  // 5. Concorrência: duas execuções simultâneas para um novo autor
  const authorConcurrent = `@Concorrente_${timestamp}`
  const execC1Id = `exec-c1-${timestamp}`
  const execC2Id = `exec-c2-${timestamp}`

  await prisma.automationExecution.createMany({
    data: [
      {
        id: execC1Id,
        organizationId: orgA,
        contentId: contentA,
        provider: 'INSTAGRAM',
        mode: 'SIMULATED',
        idempotencyKey: `idem-c1-${timestamp}`,
        inputAuthor: authorConcurrent,
        inputText: 'Concorrente 1',
        status: 'PROCESSING',
      },
      {
        id: execC2Id,
        organizationId: orgA,
        contentId: contentA,
        provider: 'INSTAGRAM',
        mode: 'SIMULATED',
        idempotencyKey: `idem-c2-${timestamp}`,
        inputAuthor: authorConcurrent,
        inputText: 'Concorrente 2',
        status: 'PROCESSING',
      },
    ],
  })

  const [resC1, resC2] = await Promise.all([
    dbRepository.saveExecutionCompleted({
      executionId: execC1Id,
      organizationId: orgA,
      automationId: autoA,
      revisionId: autoRevA,
      snapshot: snapshot1,
      outputs: outputs1,
    }),
    dbRepository.saveExecutionCompleted({
      executionId: execC2Id,
      organizationId: orgA,
      automationId: autoA,
      revisionId: autoRevA,
      snapshot: snapshot1,
      outputs: outputs1,
    }),
  ])

  assert.equal(resC1.contactId, resC2.contactId, 'Concorrência deve convergir para o mesmo Contact')
  assert.equal(
    resC1.conversationId,
    resC2.conversationId,
    'Concorrência deve convergir para a mesma Conversation',
  )
})
