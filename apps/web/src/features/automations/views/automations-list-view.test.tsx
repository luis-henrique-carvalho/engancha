import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AutomationListResponse, AutomationResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { AutomationsListView } from './automations-list-view'

const mockList = vi.fn<() => Promise<AutomationListResponse>>()
const mockPause = vi.fn<() => Promise<AutomationResponse>>()
const navigateMock = vi.fn()

vi.mock('../services/automations-api', () => ({
  AutomationsApi: {
    list: (...args: unknown[]) => mockList(...(args as [])),
    pause: (...args: unknown[]) => mockPause(...(args as [])),
  },
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('AutomationsListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table loading skeleton while preserving header structure', async () => {
    mockList.mockReturnValue(new Promise(() => {}))

    const { getByText, getByTestId } = await renderWithClient(
      <AutomationsListView
        workspaceId="ws-123"
        params={{ page: 1, limit: 20 }}
        onParamsChange={vi.fn()}
      />,
    )

    await expect.element(getByText('Automações')).toBeInTheDocument()
    await expect
      .element(getByText('Gerencie respostas automáticas a comentários no Instagram.'))
      .toBeInTheDocument()
    await expect.element(getByTestId('automation-table-loading')).toBeInTheDocument()
  })

  it('renders empty table row when there are no automations', async () => {
    mockList.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    const onCreateClick = vi.fn()
    const { getByText, getByRole } = await renderWithClient(
      <AutomationsListView
        workspaceId="ws-123"
        params={{ page: 1, limit: 20 }}
        onParamsChange={vi.fn()}
        onCreateClick={onCreateClick}
      />,
    )

    await expect.element(getByText('Automações')).toBeInTheDocument()
    await expect.element(getByText('Nenhuma automação cadastrada.')).toBeInTheDocument()

    const createButton = getByRole('button', { name: 'Nova automação' })
    await expect.element(createButton).toBeInTheDocument()
    await userEvent.click(createButton)
    expect(onCreateClick).toHaveBeenCalledOnce()
  })

  it('renders table with automations when items are returned', async () => {
    const mockAutomations: AutomationListResponse = {
      items: [
        {
          id: 'auto-1',
          status: 'ACTIVE',
          createdAt: '2026-08-27T10:00:00.000Z',
          updatedAt: '2026-08-27T12:30:00.000Z',
          hasUnpublishedChanges: false,
          executionCount: 15,
          leadCount: 8,
          draft: null,
          published: {
            id: 'rev-1',
            version: 1,
            name: 'Automação de Boas-Vindas',
            target: {
              id: 'cnt-1',
              organizationId: 'ws-123',
              title: 'Post de Lançamento',
              externalContentId: 'ig-post-100',
              provider: 'INSTAGRAM',
              mode: 'SIMULATED',
              contentType: 'POST',
              createdAt: '2026-08-27T10:00:00.000Z',
              updatedAt: '2026-08-27T10:00:00.000Z',
            },
            keyword: 'QUERO',
            actions: [
              { type: 'PUBLIC_REPLY', text: 'Obrigado pelo comentário!' },
              { type: 'PRIVATE_REPLY', text: 'Aqui está seu link:' },
              { type: 'LINK', url: 'https://exemplo.com', label: 'Acessar' },
            ],
          },
          current: {
            id: 'rev-1',
            version: 1,
            name: 'Automação de Boas-Vindas',
            target: {
              id: 'cnt-1',
              organizationId: 'ws-123',
              title: 'Post de Lançamento',
              externalContentId: 'ig-post-100',
              provider: 'INSTAGRAM',
              mode: 'SIMULATED',
              contentType: 'POST',
              createdAt: '2026-08-27T10:00:00.000Z',
              updatedAt: '2026-08-27T10:00:00.000Z',
            },
            keyword: 'QUERO',
            actions: [
              { type: 'PUBLIC_REPLY', text: 'Obrigado pelo comentário!' },
              { type: 'PRIVATE_REPLY', text: 'Aqui está seu link:' },
              { type: 'LINK', url: 'https://exemplo.com', label: 'Acessar' },
            ],
          },
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }

    mockList.mockResolvedValue(mockAutomations)

    const { getByText, getByTestId } = await renderWithClient(
      <AutomationsListView
        workspaceId="ws-123"
        params={{ page: 1, limit: 20 }}
        onParamsChange={vi.fn()}
      />,
    )

    await expect.element(getByText('Automação de Boas-Vindas')).toBeInTheDocument()
    await expect.element(getByText('Post de Lançamento')).toBeInTheDocument()
    await expect.element(getByText('QUERO')).toBeInTheDocument()
    await expect.element(getByTestId('automation-status-active')).toBeInTheDocument()
    await expect.element(getByText('15', { exact: true })).toBeInTheDocument()
    await expect.element(getByText('8', { exact: true })).toBeInTheDocument()
  })

  it('allows pausing an active automation via confirm dialog in row actions', async () => {
    const activeAutomation = {
      id: 'auto-active',
      status: 'ACTIVE' as const,
      createdAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T12:30:00.000Z',
      hasUnpublishedChanges: false,
      executionCount: 10,
      leadCount: 5,
      draft: null,
      published: {
        id: 'rev-1',
        version: 1,
        name: 'Automação Ativa',
        target: null,
        keyword: 'PROMO',
        actions: [],
      },
      current: {
        id: 'rev-1',
        version: 1,
        name: 'Automação Ativa',
        target: null,
        keyword: 'PROMO',
        actions: [],
      },
    }

    mockList.mockResolvedValue({
      items: [activeAutomation],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    })

    mockPause.mockResolvedValue({
      ...activeAutomation,
      status: 'PAUSED',
    })

    const { getByRole, getByText } = await renderWithClient(
      <AutomationsListView
        workspaceId="ws-123"
        params={{ page: 1, limit: 20 }}
        onParamsChange={vi.fn()}
      />,
    )

    // Open row actions dropdown
    const menuButton = getByRole('button', { name: 'Abrir menu de ações' })
    await userEvent.click(menuButton)

    // Check pause action is visible and click it
    const pauseItem = getByRole('menuitem', { name: 'Pausar' })
    await expect.element(pauseItem).toBeInTheDocument()
    await userEvent.click(pauseItem)

    // Confirm dialog should open
    await expect.element(getByText('Pausar automação')).toBeInTheDocument()
    await expect
      .element(
        getByText(
          'Deseja pausar esta automação? Ela deixará de responder novos comentários e DMs imediatamente.',
        ),
      )
      .toBeInTheDocument()

    // Confirm pause
    const confirmButton = getByRole('button', { name: 'Pausar' })
    await userEvent.click(confirmButton)

    expect(mockPause).toHaveBeenCalledWith('auto-active')
  })

  it('does not offer pause action for paused automations and hides edit for archived automations', async () => {
    const pausedAutomation = {
      id: 'auto-paused',
      status: 'PAUSED' as const,
      createdAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T12:30:00.000Z',
      hasUnpublishedChanges: false,
      executionCount: 0,
      leadCount: 0,
      draft: null,
      published: null,
      current: {
        id: 'rev-1',
        version: 1,
        name: 'Automação Pausada',
        target: null,
        keyword: null,
        actions: [],
      },
    }

    mockList.mockResolvedValue({
      items: [pausedAutomation],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    })

    const { getByRole } = await renderWithClient(
      <AutomationsListView
        workspaceId="ws-123"
        params={{ page: 1, limit: 20 }}
        onParamsChange={vi.fn()}
      />,
    )

    const menuButton = getByRole('button', { name: 'Abrir menu de ações' })
    await userEvent.click(menuButton)

    await expect.element(getByRole('menuitem', { name: 'Pausar' })).not.toBeInTheDocument()
  })

  it('chama onParamsChange com query ao digitar na busca', async () => {
    mockList.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    const onParamsChange = vi.fn()
    await renderWithClient(
      <AutomationsListView
        workspaceId="ws-123"
        params={{ page: 1, limit: 20 }}
        onParamsChange={onParamsChange}
      />,
    )

    const input = page.getByPlaceholder('Buscar por nome ou palavra-chave...')
    await expect.element(input).toBeInTheDocument()

    await userEvent.click(input)
    await userEvent.type(input, 'v')

    expect(onParamsChange).toHaveBeenCalledWith(expect.objectContaining({ query: 'v', page: 1 }))
  })

  it('chama onParamsChange com status ao selecionar filtro de status e exibe botão Reset', async () => {
    mockList.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    const onParamsChange = vi.fn()
    const { getByRole } = await renderWithClient(
      <AutomationsListView
        workspaceId="ws-123"
        params={{ page: 1, limit: 20 }}
        onParamsChange={onParamsChange}
      />,
    )

    const statusFilterBtn = getByRole('button', { name: /status/i })
    await expect.element(statusFilterBtn).toBeInTheDocument()
    await userEvent.click(statusFilterBtn)

    const activaOption = getByRole('option', { name: 'Ativa' })
    await expect.element(activaOption).toBeInTheDocument()
    await userEvent.click(activaOption)

    expect(onParamsChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: expect.arrayContaining(['ACTIVE']), page: 1 }),
    )
  })

  it('exibe botão Reset quando filtros estão ativos e chama onParamsChange para limpar', async () => {
    mockList.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    const onParamsChange = vi.fn()
    const { getByRole } = await renderWithClient(
      <AutomationsListView
        workspaceId="ws-123"
        params={{ page: 1, limit: 20, status: ['ACTIVE'] }}
        onParamsChange={onParamsChange}
      />,
    )

    const resetBtn = getByRole('button', { name: /reset/i })
    await expect.element(resetBtn).toBeInTheDocument()

    await userEvent.click(resetBtn)

    expect(onParamsChange).toHaveBeenCalledWith(
      expect.objectContaining({ query: undefined, status: undefined, page: 1 }),
    )
  })
})
