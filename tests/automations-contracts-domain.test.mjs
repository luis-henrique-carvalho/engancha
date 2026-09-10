import assert from 'node:assert/strict'
import test from 'node:test'
import {
  automationExecutionJobSchema,
  automationActionSchema,
  automationSnapshotSchema,
  createContentRequestSchema,
  getChannelCapabilities,
  matchesAutomationKeyword,
  normalizeAutomationKeyword,
  simulationCommentRequestSchema,
  validatePublishableAutomation,
} from '@engancha/contracts'

test('normaliza palavra-chave para matching sem acentos, hífens ou espaços extras', () => {
  assert.equal(normalizeAutomationKeyword('  Quero--o  Mátérial '), 'quero o material')
})

test('matchesAutomationKeyword verifica palavra ou frase inteira com normalização e pontuação', () => {
  assert.equal(matchesAutomationKeyword('Quero o material!', 'material'), true)
  assert.equal(matchesAutomationKeyword('Olá! Quero o e-book agora.', 'e-book'), true)
  assert.equal(matchesAutomationKeyword('QUERO O MÁTÉRIAL POR FAVOR', 'quero o material'), true)
  assert.equal(matchesAutomationKeyword('Quero materialista aqui', 'material'), false)
  assert.equal(matchesAutomationKeyword('Quero o linkagora', 'o link'), false)
  assert.equal(matchesAutomationKeyword('', 'material'), false)
  assert.equal(matchesAutomationKeyword('Olá', ''), false)
})

test('automationSnapshotSchema valida snapshot sanitizado e rejeita propriedades extras', () => {
  const validSnapshot = {
    automationId: 'auto-1',
    revisionId: 'rev-1',
    version: 1,
    target: { contentId: 'content-1' },
    trigger: {
      type: 'COMMENT_KEYWORD',
      keyword: 'Material',
      keywordNormalized: 'material',
    },
    actions: [
      {
        position: 0,
        type: 'PUBLIC_REPLY',
        config: { text: 'Vou enviar!' },
      },
      {
        position: 1,
        type: 'LINK',
        config: { url: 'https://example.com', label: 'Abrir link' },
      },
    ],
  }

  assert.deepEqual(automationSnapshotSchema.parse(validSnapshot), validSnapshot)
  assert.throws(() =>
    automationSnapshotSchema.parse({
      ...validSnapshot,
      target: { ...validSnapshot.target, token: 'secret-token' },
    }),
  )
})

test('aceita somente resposta pública, DM e uma ação final publicável', () => {
  const actions = [
    { type: 'PUBLIC_REPLY', text: 'Vou enviar.' },
    { type: 'PRIVATE_REPLY', text: 'Aqui está.' },
    { type: 'LINK', url: 'https://example.test/material' },
  ]
  assert.equal(automationActionSchema.parse(actions[2]).label, 'Abrir link')
  assert.deepEqual(
    validatePublishableAutomation({
      name: 'Material',
      targetId: 'post-1',
      keyword: 'material',
      actions,
    }),
    [],
  )
  assert.throws(() => automationActionSchema.parse({ type: 'APPLY_TAG', tagName: 'x' }))
})

test('conteúdo permanece neutro de provider para suportar novos canais', () => {
  assert.equal(
    createContentRequestSchema.parse({
      title: 'Vídeo',
      externalContentId: 't-1',
      provider: 'TIKTOK',
      contentType: 'VIDEO',
    }).provider,
    'TIKTOK',
  )
})

test('aceita comentário simulado estrito e um job de execução seguro e versionado', () => {
  const comment = {
    contentId: 'content-1',
    provider: 'INSTAGRAM',
    author: 'Ana',
    text: 'Quero o material',
    commentId: 'instagram-comment-1',
    idempotencyKey: 'simulation-001',
  }

  assert.deepEqual(simulationCommentRequestSchema.parse(comment), comment)
  assert.throws(() => simulationCommentRequestSchema.parse({ ...comment, mode: 'SIMULATED' }))

  assert.deepEqual(
    automationExecutionJobSchema.parse({
      type: 'automation.execution.requested.v1',
      version: 'v1',
      correlationId: 'simulation-001',
      executionId: 'execution-1',
      organizationId: 'organization-1',
    }),
    {
      type: 'automation.execution.requested.v1',
      version: 'v1',
      correlationId: 'simulation-001',
      executionId: 'execution-1',
      organizationId: 'organization-1',
    },
  )
})

test('valida capacidades do canal simulado Instagram', () => {
  const capabilities = getChannelCapabilities('INSTAGRAM', 'SIMULATED')
  assert.equal(capabilities.provider, 'INSTAGRAM')
  assert.equal(capabilities.mode, 'SIMULATED')
  assert.equal(capabilities.publicReply, true)
  assert.equal(capabilities.privateReply, true)
  assert.equal(capabilities.linkDelivery, true)
  assert.equal(capabilities.emailCapture, true)
  assert.deepEqual(capabilities.supportedActions, [
    'PUBLIC_REPLY',
    'PRIVATE_REPLY',
    'LINK',
    'CAPTURE_EMAIL',
  ])

  const tiktokCapabilities = getChannelCapabilities('TIKTOK', 'REAL')
  assert.equal(tiktokCapabilities.publicReply, false)
  assert.deepEqual(tiktokCapabilities.supportedActions, [])
})
