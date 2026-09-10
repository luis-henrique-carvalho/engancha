import type {
  SimulationExecutionListResponse,
  SimulationExecutionResponse,
} from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { SimulationsApi } from '../services/simulations-api'
import { useSimulationExecutionsList } from './use-simulation-executions-list'

vi.mock('../services/simulations-api', () => ({
  SimulationsApi: {
    listExecutions: vi.fn(),
    getExecution: vi.fn(),
    retryExecution: vi.fn(),
    getEventsUrl: vi.fn((id: string) => `/events/${id}`),
  },
}))

function TestListComponent({ automationId }: { automationId?: string }) {
  const hook = useSimulationExecutionsList({ automationId })
  return (
    <div>
      <button
        type="button"
        data-testid="load-more-btn"
        onClick={() => {
          void hook.loadMore()
        }}
      >
        Load More
      </button>
      <button
        type="button"
        data-testid="retry-btn"
        onClick={() => {
          void hook.retry('exec-2')
        }}
      >
        Retry
      </button>
      <span data-testid="loading">{hook.isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="count">{hook.executions.length}</span>
      <span data-testid="has-more">{hook.hasMore ? 'yes' : 'no'}</span>
      <span data-testid="first-status">{hook.executions[0]?.status ?? 'none'}</span>
      <span data-testid="first-id">{hook.executions[0]?.id ?? 'none'}</span>
    </div>
  )
}

describe('useSimulationExecutionsList', () => {
  const mockExec1: SimulationExecutionResponse = {
    id: 'exec-1',
    status: 'COMPLETED',
    simulated: true,
    provider: 'INSTAGRAM',
    contentId: 'content-1',
    input: {
      author: 'Lucas',
      text: 'Quero promoção',
      commentId: null,
      submittedAt: new Date().toISOString(),
    },
    matched: true,
    automation: {
      id: 'auto-1',
      revisionId: 'rev-1',
      version: 1,
      name: 'Promoção',
    },
    outputs: [],
    attempts: 0,
    error: null,
    stateVersion: 1,
    createdAt: new Date().toISOString(),
  }

  const mockExec2: SimulationExecutionResponse = {
    id: 'exec-2',
    status: 'FAILED',
    simulated: true,
    provider: 'INSTAGRAM',
    contentId: 'content-1',
    input: {
      author: 'Mariana',
      text: 'Comentário falho',
      commentId: null,
      submittedAt: new Date().toISOString(),
    },
    matched: null,
    automation: null,
    outputs: [],
    attempts: 1,
    error: {
      code: 'TRANSIENT_ERROR',
      message: 'Falha temporária',
    },
    stateVersion: 1,
    createdAt: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads initial executions with pagination metadata', async () => {
    const listResponse: SimulationExecutionListResponse = {
      items: [mockExec1],
      nextCursor: 'exec-1',
      hasMore: true,
    }
    vi.mocked(SimulationsApi.listExecutions).mockResolvedValueOnce(listResponse)

    const { getByTestId } = await render(<TestListComponent automationId="auto-1" />)

    await expect.element(getByTestId('count')).toHaveTextContent('1')
    await expect.element(getByTestId('has-more')).toHaveTextContent('yes')
    await expect.element(getByTestId('first-id')).toHaveTextContent('exec-1')
    await expect.element(getByTestId('first-status')).toHaveTextContent('COMPLETED')
    expect(SimulationsApi.listExecutions).toHaveBeenCalledWith({
      automationId: 'auto-1',
      limit: 20,
    })
  })

  it('loads more executions on loadMore without duplicating existing items', async () => {
    const initialResponse: SimulationExecutionListResponse = {
      items: [mockExec1],
      nextCursor: 'exec-1',
      hasMore: true,
    }
    const secondResponse: SimulationExecutionListResponse = {
      items: [mockExec2],
      nextCursor: null,
      hasMore: false,
    }

    vi.mocked(SimulationsApi.listExecutions)
      .mockResolvedValueOnce(initialResponse)
      .mockResolvedValueOnce(secondResponse)

    const { getByTestId } = await render(<TestListComponent automationId="auto-1" />)

    await expect.element(getByTestId('count')).toHaveTextContent('1')

    await getByTestId('load-more-btn').click()

    await expect.element(getByTestId('count')).toHaveTextContent('2')
    await expect.element(getByTestId('has-more')).toHaveTextContent('no')
    expect(SimulationsApi.listExecutions).toHaveBeenCalledTimes(2)
  })

  it('retries a failed execution and preserves the item in the list', async () => {
    const initialResponse: SimulationExecutionListResponse = {
      items: [mockExec2],
      nextCursor: null,
      hasMore: false,
    }

    vi.mocked(SimulationsApi.listExecutions).mockResolvedValueOnce(initialResponse)
    vi.mocked(SimulationsApi.retryExecution).mockResolvedValueOnce({
      executionId: 'exec-2',
      status: 'PENDING',
      simulated: true,
    })
    vi.mocked(SimulationsApi.getExecution).mockResolvedValue({
      ...mockExec2,
      status: 'PENDING',
      stateVersion: 2,
      error: null,
    })

    const { getByTestId } = await render(<TestListComponent automationId="auto-1" />)

    await expect.element(getByTestId('count')).toHaveTextContent('1')
    await expect.element(getByTestId('first-status')).toHaveTextContent('FAILED')

    await getByTestId('retry-btn').click()

    await expect.element(getByTestId('first-status')).toHaveTextContent('PENDING')
    await expect.element(getByTestId('first-id')).toHaveTextContent('exec-2')
    expect(SimulationsApi.retryExecution).toHaveBeenCalledWith('exec-2')
  })
})
