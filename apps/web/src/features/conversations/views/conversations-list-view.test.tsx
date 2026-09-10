import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ConversationListResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { ConversationsListView } from './conversations-list-view'

const mockList = vi.fn<() => Promise<ConversationListResponse>>()
const navigateMock = vi.fn()

vi.mock('../services/conversations-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/conversations-api')>()
  return {
    ...actual,
    ConversationsApi: {
      ...actual.ConversationsApi,
      list: (...args: unknown[]) => mockList(...(args as [])),
    },
  }
})

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Link: ({ children, ...props }: React.PropsWithChildren<{ to: string }>) => (
      <a href={props.to}>{children}</a>
    ),
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

describe('ConversationsListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title and empty message when workspace has no conversations', async () => {
    mockList.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })

    const { getByRole, getByText } = await renderWithClient(
      <ConversationsListView
        workspaceId="ws-123"
        params={{ page: 1, limit: 20 }}
        onParamsChange={vi.fn()}
      />,
    )

    await expect.element(getByRole('heading', { name: 'Conversas' })).toBeInTheDocument()
    await expect
      .element(getByText('Nenhuma conversa registrada ainda neste workspace.'))
      .toBeInTheDocument()
  })

  it('renders conversation list rows with contact, provider and message preview', async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: 'conv-1',
          provider: 'INSTAGRAM',
          mode: 'SIMULATED',
          status: 'OPEN',
          createdAt: '2026-09-10T10:00:00.000Z',
          updatedAt: '2026-09-10T10:05:00.000Z',
          contact: {
            id: 'contact-1',
            username: 'maria_silva',
            name: 'Maria Silva',
            email: 'maria@example.com',
          },
          lastMessage: {
            id: 'msg-1',
            direction: 'INBOUND',
            type: 'COMMENT',
            text: 'Quero receber as novidades',
            createdAt: '2026-09-10T10:05:00.000Z',
          },
          lead: {
            id: 'lead-1',
            capturedAt: '2026-09-10T10:05:00.000Z',
          },
          automation: {
            id: 'auto-1',
            name: 'Boas-Vindas Post',
          },
          tags: [
            {
              id: 'tag-1',
              name: 'VIP',
              normalizedName: 'vip',
            },
          ],
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    })

    const { getByText } = await renderWithClient(
      <ConversationsListView
        workspaceId="ws-123"
        params={{ page: 1, limit: 20 }}
        onParamsChange={vi.fn()}
      />,
    )

    await expect.element(getByText('@maria_silva')).toBeInTheDocument()
    await expect.element(getByText('Boas-Vindas Post')).toBeInTheDocument()
    await expect.element(getByText('Lead Capturado')).toBeInTheDocument()
    await expect.element(getByText('VIP')).toBeInTheDocument()
  })
})
