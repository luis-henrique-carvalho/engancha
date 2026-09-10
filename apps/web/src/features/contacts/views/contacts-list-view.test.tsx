import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ContactListResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { ContactsListView } from './contacts-list-view'

const mockList = vi.fn<() => Promise<ContactListResponse>>()
const navigateMock = vi.fn()

vi.mock('../services/contacts-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/contacts-api')>()
  return {
    ...actual,
    ContactsApi: {
      ...actual.ContactsApi,
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

describe('ContactsListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title and empty message when workspace has no contacts', async () => {
    mockList.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    const { getByRole, getByText } = await renderWithClient(
      <ContactsListView
        workspaceId="ws-123"
        params={{ page: 1, limit: 20 }}
        onParamsChange={vi.fn()}
      />,
    )

    await expect.element(getByRole('heading', { name: 'Contatos' })).toBeInTheDocument()
    await expect
      .element(getByText('Nenhum contato registrado ainda neste workspace.'))
      .toBeInTheDocument()
  })

  it('renders contact rows with identity, provider and lead state badge', async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: 'contact-1',
          provider: 'INSTAGRAM',
          mode: 'SIMULATED',
          externalUserId: 'ext-100',
          username: 'joao_dev',
          name: 'João Dev',
          email: 'joao@example.com',
          hasEmail: true,
          isLead: true,
          lead: {
            id: 'lead-1',
            capturedAt: '2026-09-10T11:00:00.000Z',
          },
          tags: [
            {
              id: 'tag-1',
              name: 'PROSPECT',
              normalizedName: 'prospect',
            },
          ],
          lastInteractionAt: '2026-09-10T11:00:00.000Z',
          createdAt: '2026-09-10T10:00:00.000Z',
          updatedAt: '2026-09-10T11:00:00.000Z',
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    })

    const { getByText } = await renderWithClient(
      <ContactsListView
        workspaceId="ws-123"
        params={{ page: 1, limit: 20 }}
        onParamsChange={vi.fn()}
      />,
    )

    await expect.element(getByText('@joao_dev')).toBeInTheDocument()
    await expect.element(getByText('joao@example.com')).toBeInTheDocument()
    await expect.element(getByText('Lead Convertido')).toBeInTheDocument()
    await expect.element(getByText('PROSPECT')).toBeInTheDocument()
  })
})
