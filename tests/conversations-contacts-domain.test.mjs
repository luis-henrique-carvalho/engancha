import assert from 'node:assert/strict'
import test from 'node:test'
import {
  paginationMetaSchema,
  conversationListQuerySchema,
  contactListQuerySchema,
  cursorPaginationMetaSchema,
  leadListQuerySchema,
  leadListResponseSchema,
} from '@engancha/contracts'

test('cursorPaginationMetaSchema valida metadados de paginação por cursor', () => {
  const meta = cursorPaginationMetaSchema.parse({
    limit: 20,
    nextCursor: 'eyJjYXB0dXJlZEF0IjoiMjAyNi0wOS0xMFQxMjowMDowMC4wMDBaIiwiaWQiOiJsZWFkLTEifQ',
    hasNextPage: true,
    total: 42,
  })

  assert.equal(meta.limit, 20)
  assert.equal(meta.hasNextPage, true)
  assert.equal(meta.total, 42)
  assert.ok(meta.nextCursor)
})

test('leadListQuerySchema aceita cursor, limit, query e filtros de provider/modo/automacao/tag', () => {
  const parsed = leadListQuerySchema.parse({
    limit: '25',
    cursor: 'opaque-cursor-token',
    query: '  marina  ',
    provider: 'INSTAGRAM',
    mode: 'SIMULATED',
    automationId: 'auto-123',
    tagId: 'tag-456',
  })

  assert.equal(parsed.limit, 25)
  assert.equal(parsed.cursor, 'opaque-cursor-token')
  assert.equal(parsed.query, 'marina')
  assert.deepEqual(parsed.provider, ['INSTAGRAM'])
  assert.deepEqual(parsed.mode, ['SIMULATED'])
  assert.equal(parsed.automationId, 'auto-123')
  assert.equal(parsed.tagId, 'tag-456')
})

test('leadListResponseSchema valida payload completo de leads com cursor', () => {
  const response = leadListResponseSchema.parse({
    items: [
      {
        id: 'lead-1',
        capturedAt: '2026-09-10T12:00:00.000Z',
        provider: 'INSTAGRAM',
        mode: 'SIMULATED',
        contact: {
          id: 'contact-1',
          name: 'Marina Silva',
          username: 'marina',
          externalUserId: 'ig-123',
          email: 'marina@example.com',
        },
        automation: {
          id: 'auto-1',
          name: 'Captura E-book',
        },
        originExecutionId: 'exec-1',
        tags: [
          {
            id: 'tag-1',
            name: 'VIP',
            normalizedName: 'vip',
          },
        ],
        createdAt: '2026-09-10T12:00:00.000Z',
        updatedAt: '2026-09-10T12:00:00.000Z',
      },
    ],
    meta: {
      limit: 20,
      nextCursor: null,
      hasNextPage: false,
      total: 1,
    },
  })

  assert.equal(response.items.length, 1)
  assert.equal(response.items[0].contact.email, 'marina@example.com')
  assert.equal(response.meta.hasNextPage, false)
})

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
