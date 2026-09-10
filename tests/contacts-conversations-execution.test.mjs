import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deterministicCommentMessageExternalId,
  deterministicEmailCaptureRequestId,
  normalizeContactExternalUserId,
  normalizeContactUsername,
  normalizeEmail,
  normalizeTagName,
} from '@engancha/contracts'
import { AutomationExecutionService } from '../apps/worker/src/automation-execution/application/automation-execution.service.ts'
import { PrismaAutomationExecutionRepository } from '../apps/worker/src/automation-execution/infrastructure/persistence/prisma-automation-execution.repository.ts'
import { PrismaAutomationRepository } from '../apps/api/src/modules/automations/infrastructure/persistence/prisma-automation.repository.ts'
import { PrismaEmailCaptureRepository } from '../apps/worker/src/email-capture/infrastructure/persistence/prisma-email-capture.repository.ts'
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

  // Verifica persistência de Message (inbound comment + outbound public reply)
  const messages1 = await prisma.message.findMany({
    where: { conversationId: conversation1.id },
    orderBy: { position: 'asc' },
  })
  assert.equal(messages1.length, 2)
  assert.equal(messages1[0].organizationId, orgA)
  assert.equal(messages1[0].executionId, exec1Id)
  assert.equal(messages1[0].direction, 'INBOUND')
  assert.equal(messages1[0].type, 'COMMENT')
  assert.equal(messages1[0].provider, 'INSTAGRAM')
  assert.equal(messages1[0].mode, 'SIMULATED')
  assert.equal(messages1[0].externalId, `execution:${exec1Id}:comment`)
  assert.equal(messages1[0].text, 'Eu quero o material!')
  assert.equal(messages1[0].status, 'RECEIVED')
  assert.equal(messages1[0].position, 0)

  assert.equal(messages1[1].direction, 'OUTBOUND')
  assert.equal(messages1[1].type, 'PUBLIC_REPLY')
  assert.equal(messages1[1].position, 1)

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

  // Deve haver quatro mensagens na conversa agora (2 execuções x 2 mensagens cada)
  const messagesAfter2 = await prisma.message.findMany({
    where: { conversationId: conversation1.id },
    orderBy: { createdAt: 'asc' },
  })
  assert.equal(messagesAfter2.length, 4)
  assert.equal(messagesAfter2[2].executionId, exec2Id)
  assert.equal(messagesAfter2[2].text, 'Quero novamente!')

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
  assert.equal(messagesForExec1.length, 2, 'Retry não pode criar duplicatas de mensagem')

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

test('Ticket 002: outputs projetam histórico ordenado e idempotente com EmailCaptureRequest e supersessão', async () => {
  const ts = Date.now() + 200
  const org = `org-t002-${ts}`
  const user = `user-t002-${ts}`
  const content = `content-t002-${ts}`
  const auto = `auto-t002-${ts}`
  const autoRev = `rev-t002-${ts}`

  await prisma.organization.create({
    data: { id: org, name: 'Org Ticket 002', slug: `org-t002-${ts}` },
  })

  await prisma.user.create({
    data: { id: user, name: 'User T002', email: `user-t002-${ts}@example.test` },
  })

  await prisma.content.create({
    data: {
      id: content,
      organizationId: org,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      contentType: 'POST',
      title: 'Post T002',
      externalContentId: `ext-t002-${ts}`,
    },
  })

  await prisma.automation.create({
    data: {
      id: auto,
      organizationId: org,
      createdByUserId: user,
      status: 'ACTIVE',
    },
  })

  await prisma.automationRevision.create({
    data: {
      id: autoRev,
      automationId: auto,
      version: 1,
      status: 'PUBLISHED',
      target: { create: { contentId: content } },
      trigger: {
        create: {
          type: 'COMMENT_KEYWORD',
          keyword: 'QueroT002',
          keywordNormalized: 'querot002',
        },
      },
      actions: {
        create: [
          { position: 0, type: 'PUBLIC_REPLY', config: { text: 'Resposta pública no post' } },
          { position: 1, type: 'PRIVATE_REPLY', config: { text: 'Oi! Enviando no direct' } },
          {
            position: 2,
            type: 'LINK',
            config: { url: 'https://exemplo.com/promo', label: 'Acessar promoção' },
          },
          {
            position: 3,
            type: 'CAPTURE_EMAIL',
            config: { prompt: 'Por favor, digite seu e-mail para enviarmos o material:' },
          },
        ],
      },
    },
  })

  await prisma.automation.update({
    where: { id: auto },
    data: { currentPublishedRevisionId: autoRev },
  })

  const exec1Id = `exec-t002-1-${ts}`
  await prisma.automationExecution.create({
    data: {
      id: exec1Id,
      organizationId: org,
      contentId: content,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      idempotencyKey: `idem-t002-1-${ts}`,
      inputAuthor: '@SeguidorCurioso',
      inputText: 'QueroT002 por favor!',
      commentId: `comment-t002-1-${ts}`,
      status: 'PROCESSING',
      attempts: 1,
    },
  })

  const snapshot = {
    automationId: auto,
    revisionId: autoRev,
    version: 1,
    target: { contentId: content },
    trigger: { type: 'COMMENT_KEYWORD', keyword: 'QueroT002', keywordNormalized: 'querot002' },
    actions: [
      { position: 0, type: 'PUBLIC_REPLY', config: { text: 'Resposta pública no post' } },
      { position: 1, type: 'PRIVATE_REPLY', config: { text: 'Oi! Enviando no direct' } },
      {
        position: 2,
        type: 'LINK',
        config: { url: 'https://exemplo.com/promo', label: 'Acessar promoção' },
      },
      {
        position: 3,
        type: 'CAPTURE_EMAIL',
        config: { prompt: 'Por favor, digite seu e-mail para enviarmos o material:' },
      },
    ],
  }

  const outputs1 = [
    {
      key: `${exec1Id}:0:PUBLIC_REPLY`,
      position: 0,
      type: 'PUBLIC_REPLY',
      payload: { text: 'Resposta pública no post', simulated: true },
    },
    {
      key: `${exec1Id}:1:PRIVATE_REPLY`,
      position: 1,
      type: 'PRIVATE_REPLY',
      payload: { text: 'Oi! Enviando no direct', simulated: true },
    },
    {
      key: `${exec1Id}:2:LINK_DELIVERY`,
      position: 2,
      type: 'LINK_DELIVERY',
      payload: {
        url: 'https://exemplo.com/promo',
        label: 'Acessar promoção',
        simulated: true,
      },
    },
    {
      key: `${exec1Id}:3:EMAIL_CAPTURE_REQUEST`,
      position: 3,
      type: 'EMAIL_CAPTURE_REQUEST',
      payload: {
        prompt: 'Por favor, digite seu e-mail para enviarmos o material:',
        simulated: true,
      },
    },
  ]

  // Executa conclusão da execução 1
  const result1 = await dbRepository.saveExecutionCompleted({
    executionId: exec1Id,
    organizationId: org,
    automationId: auto,
    revisionId: autoRev,
    snapshot,
    outputs: outputs1,
  })

  assert.ok(result1.contactId)
  assert.ok(result1.conversationId)

  // 1. Valida mensagens na conversa
  const messages = await prisma.message.findMany({
    where: { conversationId: result1.conversationId },
    orderBy: { position: 'asc' },
  })

  // 1 inbound comment (position 0) + 4 outbound outputs (positions 1..4)
  assert.equal(messages.length, 5)

  // Mensagem 0: Comentário Inbound
  assert.equal(messages[0].position, 0)
  assert.equal(messages[0].direction, 'INBOUND')
  assert.equal(messages[0].type, 'COMMENT')
  assert.equal(messages[0].text, 'QueroT002 por favor!')
  assert.equal(messages[0].externalId, `execution:${exec1Id}:comment`)

  // Mensagem 1: Public reply
  assert.equal(messages[1].position, 1)
  assert.equal(messages[1].direction, 'OUTBOUND')
  assert.equal(messages[1].type, 'PUBLIC_REPLY')
  assert.equal(messages[1].text, 'Resposta pública no post')
  assert.equal(messages[1].externalId, `execution:${exec1Id}:output:${outputs1[0].key}`)

  // Mensagem 2: Private reply (DM)
  assert.equal(messages[2].position, 2)
  assert.equal(messages[2].direction, 'OUTBOUND')
  assert.equal(messages[2].type, 'DIRECT_MESSAGE')
  assert.equal(messages[2].text, 'Oi! Enviando no direct')
  assert.equal(messages[2].externalId, `execution:${exec1Id}:output:${outputs1[1].key}`)

  // Mensagem 3: Link delivery (DM com link)
  assert.equal(messages[3].position, 3)
  assert.equal(messages[3].direction, 'OUTBOUND')
  assert.equal(messages[3].type, 'DIRECT_MESSAGE_WITH_LINK')
  assert.equal(messages[3].text, 'Acessar promoção: https://exemplo.com/promo')
  assert.equal(messages[3].payload.url, 'https://exemplo.com/promo')
  assert.equal(messages[3].payload.label, 'Acessar promoção')
  assert.equal(messages[3].payload.simulated, true)

  // Mensagem 4: Email capture request
  assert.equal(messages[4].position, 4)
  assert.equal(messages[4].direction, 'OUTBOUND')
  assert.equal(messages[4].type, 'EMAIL_CAPTURE_REQUEST')
  assert.equal(messages[4].text, 'Por favor, digite seu e-mail para enviarmos o material:')

  // Monotonicidade dos timestamps
  for (let i = 0; i < messages.length - 1; i++) {
    assert.ok(
      messages[i].sentAt.getTime() <= messages[i + 1].sentAt.getTime(),
      `sentAt deve ser não-decrescente: msg ${i} vs ${i + 1}`,
    )
  }

  // 2. Valida EmailCaptureRequest criado em status PENDING
  const captureRequests1 = await prisma.emailCaptureRequest.findMany({
    where: { conversationId: result1.conversationId },
  })
  assert.equal(captureRequests1.length, 1)
  const cap1 = captureRequests1[0]
  assert.equal(cap1.status, 'PENDING')
  assert.equal(cap1.organizationId, org)
  assert.equal(cap1.contactId, result1.contactId)
  assert.equal(cap1.conversationId, result1.conversationId)
  assert.equal(cap1.messageId, messages[4].id)
  assert.equal(cap1.automationId, auto)
  assert.equal(cap1.automationRevisionId, autoRev)
  assert.equal(cap1.executionId, exec1Id)

  // 3. Supersessão: Nova execução na mesma conversa com EmailCaptureRequest
  const exec2Id = `exec-t002-2-${ts}`
  await prisma.automationExecution.create({
    data: {
      id: exec2Id,
      organizationId: org,
      contentId: content,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      idempotencyKey: `idem-t002-2-${ts}`,
      inputAuthor: 'seguidorcurioso',
      inputText: 'Quero de novo!',
      commentId: `comment-t002-2-${ts}`,
      status: 'PROCESSING',
      attempts: 1,
    },
  })

  const outputs2 = [
    {
      key: `${exec2Id}:0:EMAIL_CAPTURE_REQUEST`,
      position: 0,
      type: 'EMAIL_CAPTURE_REQUEST',
      payload: {
        prompt: 'Novo prompt de e-mail:',
        simulated: true,
      },
    },
  ]

  const result2 = await dbRepository.saveExecutionCompleted({
    executionId: exec2Id,
    organizationId: org,
    automationId: auto,
    revisionId: autoRev,
    snapshot,
    outputs: outputs2,
  })

  assert.equal(result2.conversationId, result1.conversationId)

  // O pedido anterior deve ter transitado para SUPERSEDED
  const oldCapture = await prisma.emailCaptureRequest.findUniqueOrThrow({
    where: { id: cap1.id },
  })
  assert.equal(oldCapture.status, 'SUPERSEDED')

  // O novo pedido deve estar PENDING e com id determinístico
  const newCapture = await prisma.emailCaptureRequest.findFirstOrThrow({
    where: { executionId: exec2Id },
  })
  assert.equal(newCapture.status, 'PENDING')
  assert.equal(newCapture.id, deterministicEmailCaptureRequestId(exec2Id))

  // 4. Idempotência: Retry / reexecução da mesma execução 2
  const retryResult = await dbRepository.saveExecutionCompleted({
    executionId: exec2Id,
    organizationId: org,
    automationId: auto,
    revisionId: autoRev,
    snapshot,
    outputs: outputs2,
  })

  assert.equal(retryResult.conversationId, result1.conversationId)

  // Total de pedidos de captura para a execução 2 continua sendo exatamente 1 e com status PENDING
  const cap2Count = await prisma.emailCaptureRequest.count({
    where: { executionId: exec2Id },
  })
  assert.equal(cap2Count, 1)

  const currentCap2 = await prisma.emailCaptureRequest.findUniqueOrThrow({
    where: { id: newCapture.id },
  })
  assert.equal(currentCap2.status, 'PENDING')
})

test('Ticket 003: normalização, criação inline, multi-tenant e aplicação idempotente de tags no contato', async () => {
  const ts = Date.now() + 300
  const orgA = `org-t003-a-${ts}`
  const orgB = `org-t003-b-${ts}`
  const userA = `user-t003-a-${ts}`
  const contentA = `content-t003-a-${ts}`
  const autoA = `auto-t003-a-${ts}`
  const autoRevA = `rev-t003-a-${ts}`

  await prisma.organization.createMany({
    data: [
      { id: orgA, name: 'Org T003 A', slug: `org-t003-a-${ts}` },
      { id: orgB, name: 'Org T003 B', slug: `org-t003-b-${ts}` },
    ],
  })

  await prisma.user.create({
    data: { id: userA, name: 'User T003', email: `user-t003-${ts}@example.test` },
  })

  await prisma.content.create({
    data: {
      id: contentA,
      organizationId: orgA,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      contentType: 'POST',
      title: 'Post T003',
      externalContentId: `ext-t003-${ts}`,
    },
  })

  const autoRepo = new PrismaAutomationRepository(prismaService)

  // 1. Normalização de tag
  assert.equal(normalizeTagName('  #Leads-VIP  '), 'leads-vip')
  assert.equal(normalizeTagName('CLIENTE ESPECIAL'), 'cliente-especial')

  // 2. Criação inline / busca idempotente via repositório
  const tag1 = await autoRepo.findOrCreateTag(orgA, 'Leads VIP')
  assert.equal(tag1.name, 'Leads VIP')
  assert.equal(tag1.normalizedName, 'leads-vip')

  const tag1Same = await autoRepo.findOrCreateTag(orgA, '#leads-vip')
  assert.equal(tag1Same.id, tag1.id, 'Tag com mesmo nome normalizado deve reutilizar registro')

  // Tag com mesmo nome em Org B é isolada
  const tagB = await autoRepo.findOrCreateTag(orgB, 'Leads VIP')
  assert.notEqual(tagB.id, tag1.id, 'Tag em outro workspace deve ter id diferente')
  assert.equal(tagB.organizationId, orgB)

  // 3. Listagem de tags por organização
  const tagsA = await autoRepo.listTags(orgA)
  assert.equal(tagsA.length, 1)
  assert.equal(tagsA[0].id, tag1.id)

  const tagsB = await autoRepo.listTags(orgB)
  assert.equal(tagsB.length, 1)
  assert.equal(tagsB[0].id, tagB.id)

  // 4. Criação de automação e snapshot com APPLY_TAG
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
      target: { create: { contentId: contentA } },
      trigger: {
        create: {
          type: 'COMMENT_KEYWORD',
          keyword: 'TagMe',
          keywordNormalized: 'tagme',
        },
      },
      actions: {
        create: [
          { position: 0, type: 'APPLY_TAG', config: { tagId: tag1.id, name: tag1.name } },
          {
            position: 1,
            type: 'LINK',
            config: { url: 'https://exemplo.com/vip', label: 'Área VIP' },
          },
        ],
      },
    },
  })

  await prisma.automation.update({
    where: { id: autoA },
    data: { currentPublishedRevisionId: autoRevA },
  })

  // 5. Execução no worker aplica tag ao contato
  const execTagId = `exec-tag-${ts}`
  await prisma.automationExecution.create({
    data: {
      id: execTagId,
      organizationId: orgA,
      contentId: contentA,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      idempotencyKey: `idem-tag-${ts}`,
      inputAuthor: '@ClienteEspecial',
      inputText: 'TagMe agora!',
      commentId: `comment-tag-${ts}`,
      status: 'PROCESSING',
      attempts: 1,
    },
  })

  const tagSnapshot = {
    automationId: autoA,
    revisionId: autoRevA,
    version: 1,
    target: { contentId: contentA },
    trigger: { type: 'COMMENT_KEYWORD', keyword: 'TagMe', keywordNormalized: 'tagme' },
    actions: [
      { position: 0, type: 'APPLY_TAG', config: { tagId: tag1.id, name: tag1.name } },
      {
        position: 1,
        type: 'LINK',
        config: { url: 'https://exemplo.com/vip', label: 'Área VIP' },
      },
    ],
  }

  const tagOutputs = [
    {
      key: `${execTagId}:0:TAG_APPLICATION`,
      position: 0,
      type: 'TAG_APPLICATION',
      payload: {
        tagId: tag1.id,
        name: tag1.name,
        applied: true,
        simulated: true,
      },
    },
    {
      key: `${execTagId}:1:LINK_DELIVERY`,
      position: 1,
      type: 'LINK_DELIVERY',
      payload: {
        url: 'https://exemplo.com/vip',
        label: 'Área VIP',
        simulated: true,
      },
    },
  ]

  const savedTagExec = await dbRepository.saveExecutionCompleted({
    executionId: execTagId,
    organizationId: orgA,
    automationId: autoA,
    revisionId: autoRevA,
    snapshot: tagSnapshot,
    outputs: tagOutputs,
  })

  // Valida que ContactTag foi persistido com rastreabilidade
  const contactTags = await prisma.contactTag.findMany({
    where: { contactId: savedTagExec.contactId },
  })
  assert.equal(contactTags.length, 1)
  assert.equal(contactTags[0].tagId, tag1.id)
  assert.equal(contactTags[0].originExecutionId, execTagId)
  assert.equal(contactTags[0].originAutomationId, autoA)

  // Valida que o contato possui a tag mesmo antes de ter e-mail ou ser lead
  const contactRecord = await prisma.contact.findUniqueOrThrow({
    where: { id: savedTagExec.contactId },
  })
  assert.equal(contactRecord.email, null, 'Contato ainda não tem email')

  // 6. Retry da execução: Idempotência de ContactTag (não duplica nem lança erro)
  const retryTagExec = await dbRepository.saveExecutionCompleted({
    executionId: execTagId,
    organizationId: orgA,
    automationId: autoA,
    revisionId: autoRevA,
    snapshot: tagSnapshot,
    outputs: tagOutputs,
  })

  assert.equal(retryTagExec.contactId, savedTagExec.contactId)
  const contactTagsAfterRetry = await prisma.contactTag.count({
    where: { contactId: savedTagExec.contactId },
  })
  assert.equal(contactTagsAfterRetry, 1, 'Retry não duplica ContactTag')

  // 7. Multi-tenant: tentar aplicar tag de Org B na execução de Org A é bloqueado
  const foreignTagOutputs = [
    {
      key: `${execTagId}:foreign:TAG_APPLICATION`,
      position: 0,
      type: 'TAG_APPLICATION',
      payload: {
        tagId: tagB.id, // Pertence a Org B!
        name: tagB.name,
        applied: true,
      },
    },
  ]

  const execForeignId = `exec-foreign-${ts}`
  await prisma.automationExecution.create({
    data: {
      id: execForeignId,
      organizationId: orgA,
      contentId: contentA,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      idempotencyKey: `idem-foreign-${ts}`,
      inputAuthor: '@ClienteEspecial',
      inputText: 'TagMe foreign!',
      commentId: `comment-foreign-${ts}`,
      status: 'PROCESSING',
    },
  })

  await dbRepository.saveExecutionCompleted({
    executionId: execForeignId,
    organizationId: orgA,
    automationId: autoA,
    revisionId: autoRevA,
    snapshot: tagSnapshot,
    outputs: foreignTagOutputs,
  })

  // Tag de Org B não deve ter sido vinculada ao contato de Org A
  const tagBAssociated = await prisma.contactTag.findFirst({
    where: { contactId: savedTagExec.contactId, tagId: tagB.id },
  })
  assert.equal(tagBAssociated, null, 'Tag de outro workspace não pode ser associada')
})

test('normalizeEmail normaliza apenas o domínio em minúsculas e remove espaços externos', () => {
  assert.equal(normalizeEmail('  Usuario.Teste@EXEMPLO.COM  '), 'Usuario.Teste@exemplo.com')
  assert.equal(normalizeEmail('contato@Engancha.app'), 'contato@engancha.app')
  assert.equal(normalizeEmail('lead+tag@Dominio.Com.Br'), 'lead+tag@dominio.com.br')
})

test('Tickets 004 e 005: resposta de e-mail cria lead com atribuição imutável, idempotência, supersessão e conflito fechado', async () => {
  const ts = Date.now() + 400
  const orgA = `org-t004-a-${ts}`
  const orgB = `org-t004-b-${ts}`
  const user = `user-t004-${ts}`
  const contentA = `content-t004-a-${ts}`
  const autoA = `auto-t004-a-${ts}`
  const autoRevA = `rev-t004-a-${ts}`

  await prisma.organization.createMany({
    data: [
      { id: orgA, name: 'Org T004 A', slug: `org-t004-a-${ts}` },
      { id: orgB, name: 'Org T004 B', slug: `org-t004-b-${ts}` },
    ],
  })

  await prisma.user.create({
    data: { id: user, name: 'User T004', email: `user-t004-${ts}@example.test` },
  })

  await prisma.content.create({
    data: {
      id: contentA,
      organizationId: orgA,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      contentType: 'POST',
      title: 'Post T004',
      externalContentId: `ext-t004-${ts}`,
    },
  })

  await prisma.automation.create({
    data: {
      id: autoA,
      organizationId: orgA,
      createdByUserId: user,
      status: 'ACTIVE',
    },
  })

  await prisma.automationRevision.create({
    data: {
      id: autoRevA,
      automationId: autoA,
      version: 1,
      status: 'PUBLISHED',
      target: { create: { contentId: contentA } },
      trigger: {
        create: {
          type: 'COMMENT_KEYWORD',
          keyword: 'QueroMaterial',
          keywordNormalized: 'queromaterial',
        },
      },
      actions: {
        create: [
          { position: 0, type: 'PUBLIC_REPLY', config: { text: 'Oi!' } },
          {
            position: 1,
            type: 'CAPTURE_EMAIL',
            config: { prompt: 'Envie seu melhor e-mail:' },
          },
        ],
      },
    },
  })

  await prisma.automation.update({
    where: { id: autoA },
    data: { currentPublishedRevisionId: autoRevA },
  })

  const exec1Id = `exec-t004-1-${ts}`
  await prisma.automationExecution.create({
    data: {
      id: exec1Id,
      organizationId: orgA,
      contentId: contentA,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      idempotencyKey: `idem-t004-1-${ts}`,
      inputAuthor: '@SeguidorFiel',
      inputText: 'QueroMaterial!',
      commentId: `comment-t004-1-${ts}`,
      status: 'PROCESSING',
      attempts: 1,
    },
  })

  const outputs1 = [
    {
      key: `${exec1Id}:0:PUBLIC_REPLY`,
      position: 0,
      type: 'PUBLIC_REPLY',
      payload: { text: 'Oi!', simulated: true },
    },
    {
      key: `${exec1Id}:1:EMAIL_CAPTURE_REQUEST`,
      position: 1,
      type: 'EMAIL_CAPTURE_REQUEST',
      payload: { prompt: 'Envie seu melhor e-mail:', simulated: true },
    },
  ]

  const snapshot1 = {
    automationId: autoA,
    revisionId: autoRevA,
    version: 1,
    target: { contentId: contentA },
    trigger: {
      type: 'COMMENT_KEYWORD',
      keyword: 'QueroMaterial',
      keywordNormalized: 'queromaterial',
    },
    actions: [
      { position: 0, type: 'PUBLIC_REPLY', config: { text: 'Oi!' } },
      { position: 1, type: 'CAPTURE_EMAIL', config: { prompt: 'Envie seu melhor e-mail:' } },
    ],
  }

  // Completa execução 1 gerando a captura pendente
  const saved1 = await dbRepository.saveExecutionCompleted({
    executionId: exec1Id,
    organizationId: orgA,
    automationId: autoA,
    revisionId: autoRevA,
    snapshot: snapshot1,
    outputs: outputs1,
  })

  const capture1 = await prisma.emailCaptureRequest.findFirstOrThrow({
    where: { executionId: exec1Id },
  })
  assert.equal(capture1.status, 'PENDING')

  const emailRepo = new PrismaEmailCaptureRepository(prismaService)

  // 1. Processamento de resposta válida cria mensagem INBOUND, atualiza contato e cria Lead (DEC-04, DEC-08)
  const processResult1 = await emailRepo.claimAndProcess({
    type: 'email.capture.response.v1',
    version: 'v1',
    correlationId: `resp-1-${ts}`,
    captureRequestId: capture1.id,
    organizationId: orgA,
    submittedEmail: 'Seguidor@Dominio.COM',
    idempotencyKey: `resp-1-${ts}`,
  })

  assert.equal(processResult1.status, 'COMPLETED')
  assert.ok(processResult1.leadId, 'LeadId deve ser retornado')

  // A execução originária DEVE continuar COMPLETED
  const execAfterCapture = await prisma.automationExecution.findUniqueOrThrow({
    where: { id: exec1Id },
  })
  assert.equal(execAfterCapture.status, 'COMPLETED')

  // Contato enriquecido
  const contactAfterCapture = await prisma.contact.findUniqueOrThrow({
    where: { id: saved1.contactId },
  })
  assert.equal(contactAfterCapture.email, 'Seguidor@Dominio.COM')
  assert.equal(contactAfterCapture.emailNormalized, 'Seguidor@dominio.com')

  // Lead criado com atribuição originária imutável
  const lead1 = await prisma.lead.findUniqueOrThrow({
    where: { id: processResult1.leadId },
  })
  assert.equal(lead1.organizationId, orgA)
  assert.equal(lead1.contactId, saved1.contactId)
  assert.equal(lead1.automationId, autoA)
  assert.equal(lead1.executionId, exec1Id)
  assert.equal(lead1.provider, 'INSTAGRAM')
  assert.equal(lead1.mode, 'SIMULATED')
  const initialCapturedAt = lead1.capturedAt

  // Mensagem INBOUND criada com sucesso
  const responseMessage = await prisma.message.findFirstOrThrow({
    where: {
      conversationId: saved1.conversationId,
      direction: 'INBOUND',
      type: 'INCOMING_MESSAGE',
    },
  })
  assert.equal(responseMessage.text, 'Seguidor@Dominio.COM')
  assert.equal(responseMessage.status, 'RECEIVED')

  // 2. Idempotência: reprocessar o mesmo job de captura retorna o mesmo lead e não duplica efeitos
  const retryCaptureResult = await emailRepo.claimAndProcess({
    type: 'email.capture.response.v1',
    version: 'v1',
    correlationId: `resp-1-${ts}`,
    captureRequestId: capture1.id,
    organizationId: orgA,
    submittedEmail: 'Seguidor@Dominio.COM',
    idempotencyKey: `resp-1-${ts}`,
  })

  assert.equal(retryCaptureResult.status, 'COMPLETED')
  assert.equal(retryCaptureResult.leadId, lead1.id)

  const leadCountAfterRetry = await prisma.lead.count({
    where: { organizationId: orgA, contactId: saved1.contactId },
  })
  assert.equal(leadCountAfterRetry, 1, 'Não pode duplicar o Lead')

  // 3. Captura posterior não sobrescreve a atribuição do lead original (DEC-08)
  const exec2Id = `exec-t004-2-${ts}`
  await prisma.automationExecution.create({
    data: {
      id: exec2Id,
      organizationId: orgA,
      contentId: contentA,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      idempotencyKey: `idem-t004-2-${ts}`,
      inputAuthor: 'seguidorfiel',
      inputText: 'QueroMaterial novamente!',
      commentId: `comment-t004-2-${ts}`,
      status: 'PROCESSING',
      attempts: 1,
    },
  })

  await dbRepository.saveExecutionCompleted({
    executionId: exec2Id,
    organizationId: orgA,
    automationId: autoA,
    revisionId: autoRevA,
    snapshot: snapshot1,
    outputs: outputs1,
  })

  const capture2 = await prisma.emailCaptureRequest.findFirstOrThrow({
    where: { executionId: exec2Id },
  })

  const processResult2 = await emailRepo.claimAndProcess({
    type: 'email.capture.response.v1',
    version: 'v1',
    correlationId: `resp-2-${ts}`,
    captureRequestId: capture2.id,
    organizationId: orgA,
    submittedEmail: 'seguidor.novo@dominio.com',
    idempotencyKey: `resp-2-${ts}`,
  })

  assert.equal(processResult2.status, 'COMPLETED')
  assert.equal(processResult2.leadId, lead1.id, 'O lead deve permanecer o mesmo')

  const leadAfterSecondCapture = await prisma.lead.findUniqueOrThrow({
    where: { id: lead1.id },
  })
  assert.equal(
    leadAfterSecondCapture.executionId,
    exec1Id,
    'Atribuição da execução originária inicial deve ser preservada (imutável)',
  )
  assert.equal(
    leadAfterSecondCapture.capturedAt.getTime(),
    initialCapturedAt.getTime(),
    'Data de captura inicial deve permanecer inalterada',
  )

  // 4. Conflito de Identidade (DEC-05): e-mail pertencente a outro contato falha fechado
  // Cria contato secundário com e-mail cadastrado
  await prisma.contact.create({
    data: {
      organizationId: orgA,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      externalUserId: `outro_usuario_${ts}`,
      username: `outro_usuario_${ts}`,
      email: 'outro@dominio.com',
      emailNormalized: 'outro@dominio.com',
    },
  })

  // Cria uma 3ª execução para um novo seguidor
  const exec3Id = `exec-t004-3-${ts}`
  await prisma.automationExecution.create({
    data: {
      id: exec3Id,
      organizationId: orgA,
      contentId: contentA,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      idempotencyKey: `idem-t004-3-${ts}`,
      inputAuthor: `@NovoSeguidor_${ts}`,
      inputText: 'QueroMaterial!',
      status: 'PROCESSING',
      attempts: 1,
    },
  })

  const outputs3 = [
    {
      key: `${exec3Id}:0:PUBLIC_REPLY`,
      position: 0,
      type: 'PUBLIC_REPLY',
      payload: { text: 'Oi!', simulated: true },
    },
    {
      key: `${exec3Id}:1:EMAIL_CAPTURE_REQUEST`,
      position: 1,
      type: 'EMAIL_CAPTURE_REQUEST',
      payload: { prompt: 'Envie seu melhor e-mail:', simulated: true },
    },
  ]

  const saved3 = await dbRepository.saveExecutionCompleted({
    executionId: exec3Id,
    organizationId: orgA,
    automationId: autoA,
    revisionId: autoRevA,
    snapshot: snapshot1,
    outputs: outputs3,
  })

  const capture3 = await prisma.emailCaptureRequest.findFirstOrThrow({
    where: { executionId: exec3Id },
  })

  // Novo seguidor tenta submeter o e-mail que pertence a existingOtherContact
  const conflictResult = await emailRepo.claimAndProcess({
    type: 'email.capture.response.v1',
    version: 'v1',
    correlationId: `resp-3-${ts}`,
    captureRequestId: capture3.id,
    organizationId: orgA,
    submittedEmail: 'outro@DOMINIO.COM',
    idempotencyKey: `resp-3-${ts}`,
  })

  assert.equal(conflictResult.status, 'FAILED')
  assert.equal(conflictResult.errorCode, 'IDENTITY_CONFLICT')

  // Não deve criar Lead para saved3.contactId
  const leadSaved3 = await prisma.lead.findUnique({
    where: {
      organizationId_contactId: {
        organizationId: orgA,
        contactId: saved3.contactId,
      },
    },
  })
  assert.equal(leadSaved3, null, 'Conflito de identidade não deve criar Lead')

  // Contato novo não deve ter herdado o e-mail conflitante
  const contact3 = await prisma.contact.findUniqueOrThrow({
    where: { id: saved3.contactId },
  })
  assert.equal(contact3.emailNormalized, null)

  // O pedido permanece PENDING para permitir correção pelo usuário
  const capture3AfterConflict = await prisma.emailCaptureRequest.findUniqueOrThrow({
    where: { id: capture3.id },
  })
  assert.equal(capture3AfterConflict.status, 'PENDING')
  assert.equal(capture3AfterConflict.errorCode, 'IDENTITY_CONFLICT')

  // 5. Supersessão: pedido SUPERSEDED não aceita resposta
  const exec4Id = `exec-t004-4-${ts}`
  await prisma.automationExecution.create({
    data: {
      id: exec4Id,
      organizationId: orgA,
      contentId: contentA,
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      idempotencyKey: `idem-t004-4-${ts}`,
      inputAuthor: `@NovoSeguidor_${ts}`, // mesmo autor da execução 3
      inputText: 'Nova tentativa!',
      status: 'PROCESSING',
      attempts: 1,
    },
  })

  await dbRepository.saveExecutionCompleted({
    executionId: exec4Id,
    organizationId: orgA,
    automationId: autoA,
    revisionId: autoRevA,
    snapshot: snapshot1,
    outputs: outputs1,
  })

  // A captura 3 agora deve estar SUPERSEDED
  const capture3Superseded = await prisma.emailCaptureRequest.findUniqueOrThrow({
    where: { id: capture3.id },
  })
  assert.equal(capture3Superseded.status, 'SUPERSEDED')

  const supersededResult = await emailRepo.claimAndProcess({
    type: 'email.capture.response.v1',
    version: 'v1',
    correlationId: `resp-superseded-${ts}`,
    captureRequestId: capture3.id,
    organizationId: orgA,
    submittedEmail: 'correto@dominio.com',
    idempotencyKey: `resp-superseded-${ts}`,
  })
  assert.equal(supersededResult.status, 'SUPERSEDED')
})
