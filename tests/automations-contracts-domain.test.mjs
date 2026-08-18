import assert from 'node:assert/strict'
import test from 'node:test'
import {
  automationActionSchema,
  createContentRequestSchema,
  normalizeAutomationKeyword,
  validatePublishableAutomation,
} from '@engancha/contracts'

test('normaliza palavra-chave para matching sem acentos, hífens ou espaços extras', () => {
  assert.equal(normalizeAutomationKeyword('  Quero--o  Mátérial '), 'quero o material')
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
  assert.equal(createContentRequestSchema.parse({ title: 'Vídeo', externalContentId: 't-1', provider: 'TIKTOK', contentType: 'VIDEO' }).provider, 'TIKTOK')
})
