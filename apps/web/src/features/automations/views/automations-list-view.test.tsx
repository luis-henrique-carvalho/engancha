import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AutomationListResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { AutomationsListView } from './automations-list-view'

const mockList = vi.fn<() => Promise<AutomationListResponse>>()
const navigateMock = vi.fn()

vi.mock('../services/automations-api', () => ({
  AutomationsApi: {
    list: (...args: unknown[]) => mockList(...(args as [])),
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
})
