import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AutomationResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { ApiClientError } from '@/lib/api-client'
import { AutomationEditorLayoutView } from './automation-editor-layout-view'

const mockGetById = vi.fn<() => Promise<AutomationResponse>>()

vi.mock('../services/automations-api', () => ({
  AutomationsApi: {
    getById: (...args: unknown[]) => mockGetById(...(args as [])),
  },
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useLocation: () => ({ pathname: '/automations/auto-1/identification' }),
    useNavigate: () => vi.fn(),
    Link: ({ children, to, ...props }: any) => (
      <a href={typeof to === 'string' ? to : '#'} {...props}>
        {children}
      </a>
    ),
    Outlet: () => <div data-testid="outlet" />,
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

describe('AutomationEditorLayoutView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', async () => {
    mockGetById.mockReturnValue(new Promise(() => {}))

    const { getByTestId } = await renderWithClient(
      <AutomationEditorLayoutView workspaceId="ws-1" automationId="auto-1">
        <div>Conteúdo da etapa</div>
      </AutomationEditorLayoutView>,
    )

    await expect.element(getByTestId('automation-editor-loading')).toBeInTheDocument()
  })

  it('renders not found error state when automation does not exist', async () => {
    mockGetById.mockRejectedValue(
      new ApiClientError('Automação não encontrada', {
        status: 404,
        code: 'AUTOMATION_NOT_FOUND',
      }),
    )

    const { getByTestId, getByText } = await renderWithClient(
      <AutomationEditorLayoutView workspaceId="ws-1" automationId="auto-unknown">
        <div>Conteúdo da etapa</div>
      </AutomationEditorLayoutView>,
    )

    await expect.element(getByTestId('automation-editor-not-found')).toBeInTheDocument()
    await expect.element(getByText('Automação não encontrada')).toBeInTheDocument()
  })

  it('renders editor header, step navigation and step content when automation is loaded', async () => {
    const mockAutomation: AutomationResponse = {
      id: 'auto-1',
      status: 'DRAFT',
      createdAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
      hasUnpublishedChanges: false,
      executionCount: 0,
      leadCount: 0,
      draft: {
        id: 'rev-draft-1',
        version: 1,
        name: 'Automação Black Friday',
        target: null,
        keyword: null,
        actions: [],
      },
      published: null,
      current: {
        id: 'rev-draft-1',
        version: 1,
        name: 'Automação Black Friday',
        target: null,
        keyword: null,
        actions: [],
      },
    }

    mockGetById.mockResolvedValue(mockAutomation)

    const { getByText, getByTestId } = await renderWithClient(
      <AutomationEditorLayoutView workspaceId="ws-1" automationId="auto-1">
        <div data-testid="step-content">Formulário de Identificação</div>
      </AutomationEditorLayoutView>,
    )

    await expect.element(getByTestId('automation-editor-title')).toBeInTheDocument()
    await expect.element(getByText('Automação Black Friday')).toBeInTheDocument()
    await expect.element(getByTestId('automation-status-draft')).toBeInTheDocument()
    await expect.element(getByTestId('step-content')).toBeInTheDocument()
  })
})
