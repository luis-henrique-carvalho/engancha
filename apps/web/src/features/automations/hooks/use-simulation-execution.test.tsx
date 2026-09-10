import type { SimulationExecutionResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { SimulationsApi } from '../services/simulations-api'
import { useSimulationExecution } from './use-simulation-execution'

vi.mock('../services/simulations-api', () => ({
  SimulationsApi: {
    submitComment: vi.fn(),
    getExecution: vi.fn(),
    retryExecution: vi.fn(),
    getEventsUrl: vi.fn((id: string) => `/events/${id}`),
  },
}))

function TestComponent({
  initialExecutionId,
  onReady,
}: {
  initialExecutionId?: string | null
  onReady?: (hook: ReturnType<typeof useSimulationExecution>) => void
}) {
  const hook = useSimulationExecution({ initialExecutionId })
  return (
    <div>
      <button
        type="button"
        data-testid="inspect-btn"
        onClick={() => {
          onReady?.(hook)
        }}
      >
        Inspect
      </button>
      <button
        type="button"
        data-testid="reset-btn"
        onClick={() => {
          hook.reset()
        }}
      >
        Reset
      </button>
      <span data-testid="execution-id">{hook.executionId ?? 'none'}</span>
      <span data-testid="status">{hook.execution?.status ?? 'idle'}</span>
      <span data-testid="connection">{hook.connectionStatus}</span>
    </div>
  )
}

describe('useSimulationExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with idle state', async () => {
    let capturedHook: ReturnType<typeof useSimulationExecution> | undefined

    const { getByTestId } = await render(
      <TestComponent
        onReady={(hook) => {
          capturedHook = hook
        }}
      />,
    )

    await getByTestId('inspect-btn').click()
    expect(capturedHook).toBeDefined()
    expect(capturedHook!.executionId).toBeNull()
    expect(capturedHook!.execution).toBeNull()
    expect(capturedHook!.isLoading).toBe(false)
    expect(capturedHook!.isSubmitting).toBe(false)
    expect(capturedHook!.connectionStatus).toBe('idle')
  })

  it('submits a comment and sets executionId', async () => {
    vi.mocked(SimulationsApi.submitComment).mockResolvedValueOnce({
      executionId: 'exec-1',
      status: 'PENDING',
      simulated: true,
    })

    const mockExecution: SimulationExecutionResponse = {
      id: 'exec-1',
      status: 'PENDING',
      simulated: true,
      provider: 'INSTAGRAM',
      contentId: 'content-1',
      input: {
        author: '@follower',
        text: 'Quero saber mais',
        commentId: null,
        submittedAt: '2026-08-28T10:00:00.000Z',
      },
      matched: null,
      automation: null,
      outputs: [],
      attempts: 0,
      error: null,
      stateVersion: 1,
    }

    vi.mocked(SimulationsApi.getExecution).mockResolvedValue(mockExecution)

    let capturedHook: ReturnType<typeof useSimulationExecution> | undefined

    const { getByTestId } = await render(
      <TestComponent
        onReady={(hook) => {
          capturedHook = hook
        }}
      />,
    )

    await getByTestId('inspect-btn').click()

    await capturedHook!.submitComment({
      contentId: 'content-1',
      provider: 'INSTAGRAM',
      author: '@follower',
      text: 'Quero saber mais',
      originAutomationId: 'auto-123',
    })

    expect(SimulationsApi.submitComment).toHaveBeenCalledWith(
      expect.objectContaining({
        contentId: 'content-1',
        provider: 'INSTAGRAM',
        author: '@follower',
        text: 'Quero saber mais',
        originAutomationId: 'auto-123',
        idempotencyKey: expect.any(String),
      }),
    )

    await expect.element(getByTestId('execution-id')).toHaveTextContent('exec-1')
  })

  it('resets execution state', async () => {
    const mockExecution: SimulationExecutionResponse = {
      id: 'exec-initial',
      status: 'COMPLETED',
      simulated: true,
      provider: 'INSTAGRAM',
      contentId: 'content-1',
      input: {
        author: '@follower',
        text: 'Quero saber mais',
        commentId: null,
        submittedAt: '2026-08-28T10:00:00.000Z',
      },
      matched: true,
      automation: null,
      outputs: [],
      attempts: 1,
      error: null,
      stateVersion: 2,
    }
    vi.mocked(SimulationsApi.getExecution).mockResolvedValue(mockExecution)

    const { getByTestId } = await render(<TestComponent initialExecutionId="exec-initial" />)

    await expect.element(getByTestId('execution-id')).toHaveTextContent('exec-initial')

    await getByTestId('reset-btn').click()
    await expect.element(getByTestId('execution-id')).toHaveTextContent('none')
  })
})
