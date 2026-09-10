import assert from 'node:assert/strict'
import test from 'node:test'
import {
  paginationMetaSchema,
  conversationListQuerySchema,
  contactListQuerySchema,
} from '@engancha/contracts'

test('paginationMetaSchema valida meta de paginação offset canônica', () => {
  const meta = paginationMetaSchema.parse({
    page: 2,
    limit: 20,
    total: 45,
    totalPages: 3,
  })

  assert.equal(meta.page, 2)
  assert.equal(meta.limit, 20)
  assert.equal(meta.total, 45)
  assert.equal(meta.totalPages, 3)
})

test('conversationListQuerySchema aceita page e limit numéricos ou coercíveis', () => {
  const parsed = conversationListQuerySchema.parse({
    page: '3',
    limit: '15',
  })
  assert.equal(parsed.page, 3)
  assert.equal(parsed.limit, 15)
})

test('conversationListQuerySchema valida e normaliza filtros', () => {
  const parsed = conversationListQuerySchema.parse({
    query: '  Lucas  ',
    limit: '25',
    hasLead: 'true',
    status: 'OPEN',
    executionStatus: ['COMPLETED', 'FAILED'],
  })

  assert.equal(parsed.query, 'Lucas')
  assert.equal(parsed.limit, 25)
  assert.equal(parsed.hasLead, true)
  assert.deepEqual(parsed.status, ['OPEN'])
  assert.deepEqual(parsed.executionStatus, ['COMPLETED', 'FAILED'])
})

test('contactListQuerySchema valida filtros de provider e leadState', () => {
  const parsed = contactListQuerySchema.parse({
    provider: 'INSTAGRAM',
    leadState: 'LEAD',
    limit: 10,
    page: 2,
  })

  assert.deepEqual(parsed.provider, ['INSTAGRAM'])
  assert.equal(parsed.leadState, 'LEAD')
  assert.equal(parsed.limit, 10)
  assert.equal(parsed.page, 2)
})
