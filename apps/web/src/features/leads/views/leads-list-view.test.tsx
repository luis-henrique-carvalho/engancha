import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { LeadListResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { LeadsListView } from './leads-list-view'

const mockList = vi.fn<() => Promise<LeadListResponse>>()
const navigateMock = vi.fn()

vi.mock('../services/leads-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/leads-api')>()
  return {
    ...actual,
    LeadsApi: {
      ...actual.LeadsApi,
      list: (...args: unknown[]) => mockList(...(args as [])),
    },
  }
})

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

describe('LeadsListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title and empty message when workspace has no leads', async () => {
    mockList.mockResolvedValue({
      items: [],
      meta: { limit: 20, nextCursor: null, hasNextPage: false, total: 0 },
    })

    const { getByRole, getByText } = await renderWithClient(
      <LeadsListView
        workspaceId="ws-123"
        params={{ limit: 20 }}
        onParamsChange={vi.fn()}
      />,
    )

    await expect.element(getByRole('heading', { name: 'Leads' })).toBeInTheDocument()
    await expect
      .element(getByText('Nenhum lead registrado ainda neste workspace.'))
      .toBeInTheDocument()
  })

  it('renders lead rows with contact identity, authorized email, automation origin and tags', async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: 'lead-1',
          capturedAt: '2026-09-10T12:00:00.000Z',
          provider: 'INSTAGRAM',
          mode: 'SIMULATED',
          contact: {
            id: 'contact-1',
            name: 'Marina Silva',
            username: 'marina_s',
            externalUserId: 'ext-999',
            email: 'marina@example.com',
          },
          automation: {
            id: 'auto-1',
            name: 'Captação Black Friday',
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
      meta: { limit: 20, nextCursor: null, hasNextPage: false, total: 1 },
    })

    const { getByText } = await renderWithClient(
      <LeadsListView
        workspaceId="ws-123"
        params={{ limit: 20 }}
        onParamsChange={vi.fn()}
      />,
    )

    await expect.element(getByText('@marina_s')).toBeInTheDocument()
    await expect.element(getByText('marina@example.com')).toBeInTheDocument()
    await expect.element(getByText('Captação Black Friday')).toBeInTheDocument()
    await expect.element(getByText('VIP')).toBeInTheDocument()
    await expect.element(getByText('Total: 1 lead')).toBeInTheDocument()
  })

  it('navigates with cursor when clicking proxima and anterior', async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: 'lead-1',
          capturedAt: '2026-09-10T12:00:00.000Z',
          provider: 'INSTAGRAM',
          mode: 'SIMULATED',
          contact: {
            id: 'contact-1',
            username: 'lead_1',
            email: 'lead1@test.com',
          },
          tags: [],
          createdAt: '2026-09-10T12:00:00.000Z',
          updatedAt: '2026-09-10T12:00:00.000Z',
        },
      ],
      meta: {
        limit: 1,
        nextCursor: 'cursor_page_2',
        hasNextPage: true,
        total: 2,
      },
    })

    const onParamsChange = vi.fn()

    const { getByRole } = await renderWithClient(
      <LeadsListView
        workspaceId="ws-123"
        params={{ limit: 1 }}
        onParamsChange={onParamsChange}
      />,
    )

    const nextBtn = getByRole('button', { name: 'Próxima' })
    await expect.element(nextBtn).toBeEnabled()
    await nextBtn.click()

    expect(onParamsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: 'cursor_page_2',
      }),
    )
  })
})
