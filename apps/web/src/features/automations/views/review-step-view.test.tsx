import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AutomationResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { ApiClientError } from '@/lib/api-client'
import { ReviewStepView } from './review-step-view'

const mockPublish = vi.fn<() => Promise<AutomationResponse>>()
const mockPause = vi.fn<() => Promise<AutomationResponse>>()
const mockNavigate = vi.fn()

vi.mock('../services/automations-api', () => ({
  AutomationsApi: {
    publish: (...args: unknown[]) => mockPublish(...(args as [])),
    pause: (...args: unknown[]) => mockPause(...(args as [])),
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

const mockCompleteAutomation: AutomationResponse = {
  id: 'auto-100',
  status: 'DRAFT',
  createdAt: '2026-08-27T10:00:00.000Z',
  updatedAt: '2026-08-27T10:00:00.000Z',
  hasUnpublishedChanges: false,
  executionCount: 0,
  leadCount: 0,
  draft: {
    id: 'rev-100',
    version: 1,
    name: 'Campanha de Primavera',
    target: {
      id: 'post-100',
      organizationId: 'ws-1',
      title: 'Lançamento Coleção Floral',
      externalContentId: 'ig-post-100',
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      contentType: 'POST',
      createdAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
    },
    keyword: 'EU QUERO',
    actions: [
      { type: 'PUBLIC_REPLY', text: 'Obrigado pelo seu comentário no post!' },
      { type: 'PRIVATE_REPLY', text: 'Enviamos o catálogo exclusivo para você no Direct.' },
      { type: 'LINK', url: 'https://engancha.com.br/promocao', label: 'Ver catálogo' },
    ],
  },
  published: null,
  current: {
    id: 'rev-100',
    version: 1,
    name: 'Campanha de Primavera',
    target: {
      id: 'post-100',
      organizationId: 'ws-1',
      title: 'Lançamento Coleção Floral',
      externalContentId: 'ig-post-100',
      provider: 'INSTAGRAM',
      mode: 'SIMULATED',
      contentType: 'POST',
      createdAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
    },
    keyword: 'EU QUERO',
    actions: [
      { type: 'PUBLIC_REPLY', text: 'Obrigado pelo seu comentário no post!' },
      { type: 'PRIVATE_REPLY', text: 'Enviamos o catálogo exclusivo para você no Direct.' },
      { type: 'LINK', url: 'https://engancha.com.br/promocao', label: 'Ver catálogo' },
    ],
  },
}

const mockIncompleteAutomation: AutomationResponse = {
  id: 'auto-200',
  status: 'DRAFT',
  createdAt: '2026-08-27T10:00:00.000Z',
  updatedAt: '2026-08-27T10:00:00.000Z',
  hasUnpublishedChanges: false,
  executionCount: 0,
  leadCount: 0,
  draft: {
    id: 'rev-200',
    version: 1,
    name: 'Automação Incompleta',
    target: null,
    keyword: null,
    actions: [],
  },
  published: null,
  current: {
    id: 'rev-200',
    version: 1,
    name: 'Automação Incompleta',
    target: null,
    keyword: null,
    actions: [],
  },
}

describe('ReviewStepView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders consolidated summary of all 6 steps and enables publish button when automation is complete', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <ReviewStepView
          workspaceId="ws-1"
          automationId="auto-100"
          automation={mockCompleteAutomation}
        />
      </QueryClientProvider>,
    )

    // Checklist status
    await expect
      .element(getByTestId('automation-readiness-badge'))
      .toHaveTextContent('6 de 6 etapas preenchidas')
    await expect
      .element(getByTestId('automation-readiness-status'))
      .toHaveTextContent('Pronta para publicação')

    // Summary sections
    const idCard = getByTestId('automation-review-summary-identification')
    await expect.element(idCard).toBeInTheDocument()
    await expect.element(idCard.getByText('Campanha de Primavera')).toBeInTheDocument()

    const contentCard = getByTestId('automation-review-summary-content')
    await expect.element(contentCard).toBeInTheDocument()
    await expect.element(contentCard.getByText('Lançamento Coleção Floral')).toBeInTheDocument()

    const keywordCard = getByTestId('automation-review-summary-keyword')
    await expect.element(keywordCard).toBeInTheDocument()
    await expect.element(keywordCard.getByText('EU QUERO')).toBeInTheDocument()

    const publicReplyCard = getByTestId('automation-review-summary-public-reply')
    await expect.element(publicReplyCard).toBeInTheDocument()
    await expect
      .element(publicReplyCard.getByText('Obrigado pelo seu comentário no post!'))
      .toBeInTheDocument()

    const directMessageCard = getByTestId('automation-review-summary-direct-message')
    await expect.element(directMessageCard).toBeInTheDocument()
    await expect
      .element(directMessageCard.getByText('Enviamos o catálogo exclusivo para você no Direct.'))
      .toBeInTheDocument()

    const finalActionCard = getByTestId('automation-review-summary-final-action')
    await expect.element(finalActionCard).toBeInTheDocument()
    await expect
      .element(finalActionCard.getByText('https://engancha.com.br/promocao'))
      .toBeInTheDocument()

    // Publish button
    const publishButton = getByTestId('automation-publish-button')
    await expect.element(publishButton).toBeInTheDocument()
    await expect.element(publishButton).not.toBeDisabled()
  })

  it('renders checklist highlighting pending steps and disables publish button when draft is incomplete', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <ReviewStepView
          workspaceId="ws-1"
          automationId="auto-200"
          automation={mockIncompleteAutomation}
        />
      </QueryClientProvider>,
    )

    // Checklist badge shows 1 of 6 complete
    await expect
      .element(getByTestId('automation-readiness-badge'))
      .toHaveTextContent('1 de 6 etapas preenchidas')
    await expect
      .element(getByTestId('automation-readiness-status'))
      .toHaveTextContent('Pendências encontradas')

    // Pending indicators
    await expect.element(getByTestId('readiness-item-status-content')).toHaveTextContent('Pendente')
    await expect.element(getByTestId('readiness-item-status-keyword')).toHaveTextContent('Pendente')
    await expect
      .element(getByTestId('readiness-item-status-public-reply'))
      .toHaveTextContent('Pendente')
    await expect
      .element(getByTestId('readiness-item-status-direct-message'))
      .toHaveTextContent('Pendente')
    await expect
      .element(getByTestId('readiness-item-status-final-action'))
      .toHaveTextContent('Pendente')

    // Publish button is disabled
    const publishButton = getByTestId('automation-publish-button')
    await expect.element(publishButton).toBeDisabled()
  })

  it('navigates to specific step when shortcut link or edit button is clicked', async () => {
    const queryClient = createTestQueryClient()
    const onNavigateStepMock = vi.fn()

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <ReviewStepView
          workspaceId="ws-1"
          automationId="auto-200"
          automation={mockIncompleteAutomation}
          onNavigateStep={onNavigateStepMock}
        />
      </QueryClientProvider>,
    )

    const configureContentBtn = getByTestId('automation-review-step-content-action')
    await configureContentBtn.click()
    expect(onNavigateStepMock).toHaveBeenCalledWith('content')

    const editIdentificationBtn = getByTestId('automation-review-edit-identification')
    await editIdentificationBtn.click()
    expect(onNavigateStepMock).toHaveBeenCalledWith('identification')
  })

  it('publishes automation successfully and updates state when clicking publish button', async () => {
    const queryClient = createTestQueryClient()
    const publishedResponse: AutomationResponse = {
      ...mockCompleteAutomation,
      status: 'ACTIVE',
      published: mockCompleteAutomation.current,
    }
    mockPublish.mockResolvedValue(publishedResponse)

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <ReviewStepView
          workspaceId="ws-1"
          automationId="auto-100"
          automation={mockCompleteAutomation}
        />
      </QueryClientProvider>,
    )

    const publishButton = getByTestId('automation-publish-button')
    await publishButton.click()

    expect(mockPublish).toHaveBeenCalledWith('auto-100')
  })

  it('handles backend validation error AUTOMATION_NOT_PUBLISHABLE and displays error banner', async () => {
    const queryClient = createTestQueryClient()
    const apiError = new ApiClientError('Automation is not publishable', {
      status: 422,
      code: 'AUTOMATION_NOT_PUBLISHABLE',
      issues: ['targetId', 'keyword'],
    })
    mockPublish.mockRejectedValue(apiError)

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <ReviewStepView
          workspaceId="ws-1"
          automationId="auto-100"
          automation={mockCompleteAutomation}
        />
      </QueryClientProvider>,
    )

    const publishButton = getByTestId('automation-publish-button')
    await publishButton.click()

    const errorAlert = getByTestId('automation-publish-error-alert')
    await expect.element(errorAlert).toBeInTheDocument()
    await expect.element(errorAlert.getByText('Conteúdo')).toBeInTheDocument()
    await expect.element(errorAlert.getByText('Palavra-chave')).toBeInTheDocument()
  })

  it('allows pausing an active automation with confirm dialog from review view', async () => {
    const queryClient = createTestQueryClient()
    const activeAutomation: AutomationResponse = {
      ...mockCompleteAutomation,
      status: 'ACTIVE',
      published: mockCompleteAutomation.current,
    }
    mockPause.mockResolvedValue({
      ...activeAutomation,
      status: 'PAUSED',
    })

    const { getByTestId, getByRole, getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <ReviewStepView
          workspaceId="ws-1"
          automationId="auto-100"
          automation={activeAutomation}
        />
      </QueryClientProvider>,
    )

    const pauseButton = getByTestId('automation-pause-button')
    await expect.element(pauseButton).toBeInTheDocument()
    await pauseButton.click()

    await expect
      .element(getByRole('heading', { name: 'Pausar automação' }))
      .toBeInTheDocument()
    const confirmButton = getByRole('button', { name: 'Pausar' })
    await confirmButton.click()

    expect(mockPause).toHaveBeenCalledWith('auto-100')
  })

  it('handles backend conflict error AUTOMATION_TRIGGER_CONFLICT and provides shortcuts', async () => {
    const queryClient = createTestQueryClient()
    const onNavigateStepMock = vi.fn()
    const conflictError = new ApiClientError('Conflict on automation trigger', {
      status: 409,
      code: 'AUTOMATION_TRIGGER_CONFLICT',
    })
    mockPublish.mockRejectedValue(conflictError)

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <ReviewStepView
          workspaceId="ws-1"
          automationId="auto-100"
          automation={mockCompleteAutomation}
          onNavigateStep={onNavigateStepMock}
        />
      </QueryClientProvider>,
    )

    const publishButton = getByTestId('automation-publish-button')
    await publishButton.click()

    const errorAlert = getByTestId('automation-publish-error-alert')
    await expect.element(errorAlert).toBeInTheDocument()
    await expect
      .element(
        errorAlert.getByText(
          'Já existe outra automação ativa configurada para a mesma combinação de conteúdo e palavra-chave.',
        ),
      )
      .toBeInTheDocument()

    const contentShortcut = errorAlert.getByRole('button', { name: 'Conteúdo' })
    await contentShortcut.click()
    expect(onNavigateStepMock).toHaveBeenCalledWith('content')
  })
})
