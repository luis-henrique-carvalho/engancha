import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SimulationsApi } from './simulations-api'

describe('SimulationsApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('submits a comment and returns validated response', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          executionId: 'exec-123',
          status: 'PENDING',
          simulated: true,
        }),
        {
          status: 201,
          headers: { 'content-type': 'application/json' },
        },
      ),
    )

    const response = await SimulationsApi.submitComment({
      contentId: 'content-1',
      provider: 'INSTAGRAM',
      author: '@teste',
      text: 'Quero o link',
      idempotencyKey: 'a0000000-0000-0000-0000-000000000001',
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/simulations/comments'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          contentId: 'content-1',
          provider: 'INSTAGRAM',
          author: '@teste',
          text: 'Quero o link',
          idempotencyKey: 'a0000000-0000-0000-0000-000000000001',
        }),
      }),
    )
    expect(response).toEqual({
      executionId: 'exec-123',
      status: 'PENDING',
      simulated: true,
    })
  })

  it('gets execution details and returns validated response', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'exec-123',
          status: 'COMPLETED',
          simulated: true,
          provider: 'INSTAGRAM',
          contentId: 'content-1',
          input: {
            author: '@teste',
            text: 'Quero o link',
            commentId: null,
            submittedAt: '2026-08-28T10:00:00.000Z',
          },
          matched: true,
          automation: {
            id: 'auto-1',
            revisionId: 'rev-1',
            version: 1,
          },
          outputs: [
            {
              id: 'out-1',
              key: 'exec-123:0:PUBLIC_REPLY',
              position: 0,
              type: 'PUBLIC_REPLY',
              payload: { text: 'Enviado!' },
              createdAt: '2026-08-28T10:00:01.000Z',
            },
          ],
          attempts: 1,
          error: null,
          stateVersion: 2,
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    )

    const response = await SimulationsApi.getExecution('exec-123')

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/simulations/executions/exec-123'),
      expect.anything(),
    )
    expect(response.id).toBe('exec-123')
    expect(response.status).toBe('COMPLETED')
    expect(response.outputs).toHaveLength(1)
  })

  it('retries execution and returns validated response', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          executionId: 'exec-123',
          status: 'PENDING',
          simulated: true,
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    )

    const response = await SimulationsApi.retryExecution('exec-123')

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/simulations/executions/exec-123/retry'),
      expect.objectContaining({
        method: 'POST',
      }),
    )
    expect(response.executionId).toBe('exec-123')
  })
})
