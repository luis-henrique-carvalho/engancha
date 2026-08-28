import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AutomationResponse, ContentListResponse, ContentResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { ContentStepView } from './content-step-view'

const mockPatch = vi.fn<() => Promise<AutomationResponse>>()
const mockListContents = vi.fn<() => Promise<ContentListResponse>>()
const mockCreateContent = vi.fn<() => Promise<ContentResponse>>()
const mockNavigate = vi.fn()

vi.mock('../services/automations-api', () => ({
  AutomationsApi: {
    patch: (...args: unknown[]) => mockPatch(...(args as [])),
  },
}))

vi.mock('../services/simulated-contents-api', () => ({
  SimulatedContentsApi: {
    list: (...args: unknown[]) => mockListContents(...(args as [])),
    create: (...args: unknown[]) => mockCreateContent(...(args as [])),
  },
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
}

const mockContent1: ContentResponse = {
  id: 'content-1',
  organizationId: 'ws-1',
  title: 'Post de Promoção de Verão',
  externalContentId: 'post_verao_01',
  provider: 'INSTAGRAM',
  mode: 'SIMULATED',
  contentType: 'POST',
  createdAt: '2026-08-27T10:00:00.000Z',
  updatedAt: '2026-08-27T10:00:00.000Z',
}

const mockContent2: ContentResponse = {
  id: 'content-2',
  organizationId: 'ws-1',
  title: 'Reel de Demonstração',
  externalContentId: 'reel_demo_02',
  provider: 'INSTAGRAM',
  mode: 'SIMULATED',
  contentType: 'VIDEO',
  createdAt: '2026-08-27T10:00:00.000Z',
  updatedAt: '2026-08-27T10:00:00.000Z',
}

const mockDraftAutomation: AutomationResponse = {
  id: 'auto-1',
  status: 'DRAFT',
  createdAt: '2026-08-27T10:00:00.000Z',
  updatedAt: '2026-08-27T10:00:00.000Z',
  hasUnpublishedChanges: false,
  executionCount: 0,
  leadCount: 0,
  draft: {
    id: 'rev-1',
    version: 1,
    name: 'Campanha de Primavera',
    target: null,
    keyword: null,
    actions: [],
  },
  published: null,
  current: {
    id: 'rev-1',
    version: 1,
    name: 'Campanha de Primavera',
    target: null,
    keyword: null,
    actions: [],
  },
}

describe('ContentStepView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListContents.mockResolvedValue({
      items: [mockContent1, mockContent2],
      meta: { page: 1, limit: 50, total: 2, totalPages: 1 },
    })
  })

  it('renders content picker with loaded items', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId, getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <ContentStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    await expect.element(getByTestId('content-picker')).toBeInTheDocument()
    await expect.element(getByText('Post de Promoção de Verão')).toBeInTheDocument()
    await expect.element(getByText('Reel de Demonstração')).toBeInTheDocument()
    await expect.element(getByTestId('automation-save-step-button')).toBeInTheDocument()
  })

  it('allows selecting a content item and saving targetId', async () => {
    const queryClient = createTestQueryClient()
    mockPatch.mockResolvedValue({
      ...mockDraftAutomation,
      current: { ...mockDraftAutomation.current!, target: mockContent1 },
    })

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <ContentStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    const card1 = getByTestId('content-card-content-1')
    await card1.click()

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    expect(mockPatch).toHaveBeenCalledWith('auto-1', { targetId: 'content-1' })
  })

  it('allows unselecting an item and saving targetId as null', async () => {
    const queryClient = createTestQueryClient()
    const automationWithTarget = {
      ...mockDraftAutomation,
      current: { ...mockDraftAutomation.current!, target: mockContent1 },
    }
    mockPatch.mockResolvedValue(mockDraftAutomation)

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <ContentStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={automationWithTarget}
        />
      </QueryClientProvider>,
    )

    const card1 = getByTestId('content-card-content-1')
    await card1.click()

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    expect(mockPatch).toHaveBeenCalledWith('auto-1', { targetId: null })
  })

  it('filters content items by search input', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId, getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <ContentStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    const searchInput = getByTestId('content-search-input')
    await searchInput.fill('Reel')

    await expect.element(getByText('Reel de Demonstração')).toBeInTheDocument()
    await expect.element(getByText('Post de Promoção de Verão')).not.toBeInTheDocument()
  })

  it('opens dialog, creates new simulated content, auto-selects it and saves targetId', async () => {
    const queryClient = createTestQueryClient()
    const newContent: ContentResponse = {
      id: 'content-new',
      organizationId: 'ws-1',
      title: 'Post Criado Inline',
      externalContentId: 'post_inline_99',
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      contentType: 'POST',
      createdAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
    }
    mockCreateContent.mockResolvedValue(newContent)
    mockPatch.mockResolvedValue({
      ...mockDraftAutomation,
      current: { ...mockDraftAutomation.current!, target: newContent },
    })

    const { getByTestId, getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <ContentStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    const openDialogButton = getByTestId('open-create-content-dialog-button')
    await openDialogButton.click()

    await expect.element(getByText('Criar conteúdo simulado')).toBeInTheDocument()

    const titleInput = getByTestId('create-simulated-content-title')
    const idInput = getByTestId('create-simulated-content-id')

    await titleInput.fill('Post Criado Inline')
    await idInput.fill('post_inline_99')

    const submitDialogButton = getByTestId('submit-create-simulated-content')
    await submitDialogButton.click()

    expect(mockCreateContent).toHaveBeenCalledWith({
      title: 'Post Criado Inline',
      externalContentId: 'post_inline_99',
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      contentType: 'POST',
    })

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    expect(mockPatch).toHaveBeenCalledWith('auto-1', { targetId: 'content-new' })
  })

  it('navigates to next step /keyword when next button is clicked', async () => {
    const queryClient = createTestQueryClient()
    const onNextMock = vi.fn()

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <ContentStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
          onNext={onNextMock}
        />
      </QueryClientProvider>,
    )

    const nextButton = getByTestId('automation-next-step-button')
    await nextButton.click()

    expect(onNextMock).toHaveBeenCalledTimes(1)
  })
})
