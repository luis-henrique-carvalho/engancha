import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClientError, apiFetch } from './api-client'

describe('ApiClientError', () => {
  it('instantiates with numeric status for backwards compatibility', () => {
    const error = new ApiClientError('Not found', 404)
    expect(error.message).toBe('Not found')
    expect(error.status).toBe(404)
    expect(error.code).toBeUndefined()
    expect(error.issues).toBeUndefined()
    expect(error.requestId).toBeUndefined()
    expect(error.name).toBe('ApiClientError')
  })

  it('preserves status, code, issues, and requestId from options object', () => {
    const error = new ApiClientError('Validation failed', {
      status: 400,
      code: 'AUTOMATION_NOT_PUBLISHABLE',
      issues: ['keyword', 'actions'],
      requestId: 'req-abc-123',
    })
    expect(error.message).toBe('Validation failed')
    expect(error.status).toBe(400)
    expect(error.code).toBe('AUTOMATION_NOT_PUBLISHABLE')
    expect(error.issues).toEqual(['keyword', 'actions'])
    expect(error.requestId).toBe('req-abc-123')
  })
})

describe('apiFetch', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns parsed body on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [1, 2, 3] }),
    })

    const result = await apiFetch<{ success: boolean; data: number[] }>('/test')
    expect(result).toEqual({ success: true, data: [1, 2, 3] })
  })

  it('throws ApiClientError with full metadata when response is not ok', async () => {
    const headers = new Headers({ 'x-request-id': 'req-xyz' })
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      headers,
      json: () =>
        Promise.resolve({
          statusCode: 409,
          code: 'AUTOMATION_TRIGGER_CONFLICT',
          message: 'Trigger combination already active',
          issues: ['targetId', 'keyword'],
          requestId: 'req-xyz',
        }),
    })

    await expect(apiFetch('/automations/1/publish')).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiClientError)
      const apiError = err as ApiClientError
      expect(apiError.status).toBe(409)
      expect(apiError.code).toBe('AUTOMATION_TRIGGER_CONFLICT')
      expect(apiError.message).toBe('Trigger combination already active')
      expect(apiError.issues).toEqual(['targetId', 'keyword'])
      expect(apiError.requestId).toBe('req-xyz')
      return true
    })
  })
})
