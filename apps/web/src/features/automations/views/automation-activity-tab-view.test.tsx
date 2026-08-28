import type {
  SimulationExecutionListResponse,
  SimulationExecutionResponse,
} from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { SimulationsApi } from '../services/simulations-api'
import { AutomationActivityTabView } from './automation-activity-tab-view'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Link: ({ children, to, ...props }: any) => (
      <a
        href={typeof to === 'string' ? to : '#'}
        {...props}
      >
        {children}
      </a>
    ),
  }
})

vi.mock('../services/simulations-api', () => ({
  SimulationsApi: {
    listExecutions: vi.fn(),
    getExecution: vi.fn(),
    retryExecution: vi.fn(),
    getEventsUrl: vi.fn((id: string) => `/events/${id}`),
  },
}))

describe('AutomationActivityTabView', () => {
  const completedExec: SimulationExecutionResponse = {
    id: 'exec-completed',
    status: 'COMPLETED',
    simulated: true,
    provider: 'INSTAGRAM',
    contentId: 'content-1',
    originAutomationId: 'auto-1',
    content: {
      id: 'content-1',
      title: 'Lançamento de Produto',
      contentType: 'POST',
      externalContentId: 'post-123',
    },
    input: {
      author: 'lucas_silva',
      text: 'Quero o desconto VIP',
      commentId: 'cmt-1',
      submittedAt: new Date().toISOString(),
    },
    matched: true,
    automation: {
      id: 'auto-1',
      revisionId: 'rev-1',
      version: 1,
      name: 'Campanha Desconto VIP',
    },
    outputs: [
      {
        id: 'out-1',
        key: 'out-pub',
        position: 0,
        type: 'PUBLIC_REPLY',
        payload: { text: 'Oi @lucas_silva! Enviamos os detalhes por DM.' },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'out-2',
        key: 'out-priv',
        position: 1,
        type: 'PRIVATE_REPLY',
        payload: { text: 'Aqui está sua oferta especial!' },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'out-3',
        key: 'out-link',
        position: 2,
        type: 'LINK_DELIVERY',
        payload: { url: 'https://engancha.app/vip', buttonText: 'Resgatar Desconto' },
        createdAt: new Date().toISOString(),
      },
    ],
    attempts: 0,
    error: null,
    stateVersion: 3,
    createdAt: new Date().toISOString(),
  }

  const ignoredExec: SimulationExecutionResponse = {
    id: 'exec-ignored',
    status: 'IGNORED',
    simulated: true,
    provider: 'INSTAGRAM',
    contentId: 'content-1',
    originAutomationId: 'auto-1',
    content: {
      id: 'content-1',
      title: 'Lançamento de Produto',
      contentType: 'POST',
      externalContentId: 'post-123',
    },
    input: {
      author: 'marcos_lima',
      text: 'Qual o valor do frete?',
      commentId: 'cmt-2',
      submittedAt: new Date().toISOString(),
    },
    matched: false,
    automation: null,
    outputs: [],
    attempts: 0,
    error: null,
    stateVersion: 1,
    createdAt: new Date().toISOString(),
  }

  const failedExec: SimulationExecutionResponse = {
    id: 'exec-failed',
    status: 'FAILED',
    simulated: true,
    provider: 'INSTAGRAM',
    contentId: 'content-1',
    originAutomationId: 'auto-1',
    content: {
      id: 'content-1',
      title: 'Lançamento de Produto',
      contentType: 'POST',
      externalContentId: 'post-123',
    },
    input: {
      author: 'carla_dias',
      text: 'Quero VIP',
      commentId: 'cmt-3',
      submittedAt: new Date().toISOString(),
    },
    matched: true,
    automation: {
      id: 'auto-1',
      revisionId: 'rev-1',
      version: 1,
      name: 'Campanha Desconto VIP',
    },
    outputs: [],
    attempts: 2,
    error: {
      code: 'DELIVERY_TIMEOUT',
      message: 'Não foi possível entregar a resposta simulada.',
    },
    stateVersion: 2,
    createdAt: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when there are no executions', async () => {
    const emptyResponse: SimulationExecutionListResponse = {
      items: [],
      nextCursor: null,
      hasMore: false,
    }
    vi.mocked(SimulationsApi.listExecutions).mockResolvedValueOnce(emptyResponse)

    const { getByTestId } = await render(<AutomationActivityTabView automationId="auto-1" />)

    await expect.element(getByTestId('automation-activity-empty')).toBeInTheDocument()
    await expect
      .element(getByTestId('automation-activity-empty'))
      .toHaveTextContent('Nenhuma atividade registrada')
  })

  it('renders activity items with status, author, match info and expand journey', async () => {
    const listResponse: SimulationExecutionListResponse = {
      items: [completedExec, ignoredExec, failedExec],
      nextCursor: null,
      hasMore: false,
    }
    vi.mocked(SimulationsApi.listExecutions).mockResolvedValueOnce(listResponse)

    const { getByTestId } = await render(<AutomationActivityTabView automationId="auto-1" />)

    await expect.element(getByTestId('automation-activity-list')).toBeInTheDocument()

    // Verificação de exec-completed
    const completedItem = getByTestId('activity-item-exec-completed')
    await expect.element(completedItem).toBeInTheDocument()
    await expect.element(completedItem).toHaveTextContent('@lucas_silva')
    await expect.element(completedItem).toHaveTextContent('Concluído')
    await expect.element(completedItem).toHaveTextContent('Automação: Campanha Desconto VIP')

    // Verificação de exec-ignored (Sem correspondência)
    const ignoredItem = getByTestId('activity-item-exec-ignored')
    await expect.element(ignoredItem).toBeInTheDocument()
    await expect.element(ignoredItem).toHaveTextContent('@marcos_lima')
    await expect.element(ignoredItem).toHaveTextContent('Sem correspondência')

    // Verificação de exec-failed
    const failedItem = getByTestId('activity-item-exec-failed')
    await expect.element(failedItem).toBeInTheDocument()
    await expect.element(failedItem).toHaveTextContent('@carla_dias')
    await expect.element(failedItem).toHaveTextContent('Falhou')

    // Retry button appears only on failed entry
    const retryBtn = failedItem.element().querySelector('[data-testid="activity-retry-button"]')
    expect(retryBtn).not.toBeNull()

    const completedRetryBtn = completedItem
      .element()
      .querySelector('[data-testid="activity-retry-button"]')
    expect(completedRetryBtn).toBeNull()

    // Expand journey for completed execution
    const expandBtn = completedItem
      .element()
      .querySelector('[data-testid="activity-expand-button"]')
    expect(expandBtn).not.toBeNull()
    ;(expandBtn as HTMLElement).click()

    await expect.element(completedItem).toHaveTextContent('Jornada da interação')
    await expect.element(completedItem).toHaveTextContent('Resposta pública simulada')
    await expect.element(completedItem).toHaveTextContent('Mensagem direta simulada')
    await expect.element(completedItem).toHaveTextContent('Resgatar Desconto')

    // Ensure no raw infrastructure words appear
    const fullText = getByTestId('automation-activity-tab-view').element().textContent || ''
    expect(fullText).not.toContain('Redis')
    expect(fullText).not.toContain('BullMQ')
    expect(fullText).not.toContain('worker')
    expect(fullText).not.toContain('stack trace')
  })

  it('handles retry on failed execution preserving item', async () => {
    const listResponse: SimulationExecutionListResponse = {
      items: [failedExec],
      nextCursor: null,
      hasMore: false,
    }
    vi.mocked(SimulationsApi.listExecutions).mockResolvedValueOnce(listResponse)
    vi.mocked(SimulationsApi.retryExecution).mockResolvedValueOnce({
      executionId: 'exec-failed',
      status: 'PENDING',
      simulated: true,
    })
    vi.mocked(SimulationsApi.getExecution).mockResolvedValue({
      ...failedExec,
      status: 'PENDING',
      stateVersion: 3,
      error: null,
    })

    const { getByTestId } = await render(<AutomationActivityTabView automationId="auto-1" />)

    const failedItem = getByTestId('activity-item-exec-failed')
    await expect.element(failedItem).toBeInTheDocument()

    const retryBtn = failedItem.element().querySelector('[data-testid="activity-retry-button"]')
    expect(retryBtn).not.toBeNull()
    ;(retryBtn as HTMLElement).click()

    expect(SimulationsApi.retryExecution).toHaveBeenCalledWith('exec-failed')
  })

  it('renders toolbar with search input, faceted filters and pagination', async () => {
    const listResponse: SimulationExecutionListResponse = {
      items: [completedExec],
      nextCursor: null,
      hasMore: false,
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    }
    vi.mocked(SimulationsApi.listExecutions).mockResolvedValueOnce(listResponse)

    const { getByTestId } = await render(<AutomationActivityTabView automationId="auto-1" />)

    await expect.element(getByTestId('activity-toolbar')).toBeInTheDocument()
    await expect.element(getByTestId('activity-search-input')).toBeInTheDocument()
    await expect.element(getByTestId('activity-pagination')).toBeInTheDocument()
  })

  it('renders filtered empty state when filters are active and no items match', async () => {
    const emptyResponse: SimulationExecutionListResponse = {
      items: [],
      nextCursor: null,
      hasMore: false,
      meta: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
      },
    }
    vi.mocked(SimulationsApi.listExecutions).mockResolvedValueOnce(emptyResponse)

    const handleReset = vi.fn()
    const { getByTestId } = await render(
      <AutomationActivityTabView
        automationId="auto-1"
        query="termo-inexistente"
        filters={{ status: ['FAILED'] }}
        onReset={handleReset}
      />,
    )

    await expect.element(getByTestId('automation-activity-filtered-empty')).toBeInTheDocument()
    await expect
      .element(getByTestId('automation-activity-filtered-empty'))
      .toHaveTextContent('Nenhuma atividade encontrada')

    const resetBtn = getByTestId('activity-empty-reset-button')
    await expect.element(resetBtn).toBeInTheDocument()
    ;(resetBtn.element() as HTMLElement).click()

    expect(handleReset).toHaveBeenCalled()
  })

  it('renders header and toolbar while loading cards skeleton', async () => {
    // Keep promise pending so it stays in loading state
    vi.mocked(SimulationsApi.listExecutions).mockImplementationOnce(() => new Promise(() => {}))

    const { getByTestId } = await render(<AutomationActivityTabView automationId="auto-1" />)

    await expect.element(getByTestId('activity-refresh-button')).toBeInTheDocument()
    await expect.element(getByTestId('activity-toolbar')).toBeInTheDocument()
    await expect.element(getByTestId('automation-activity-loading')).toBeInTheDocument()
  })
})
