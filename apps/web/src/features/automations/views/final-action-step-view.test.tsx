import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AutomationResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { FinalActionStepView } from './final-action-step-view'

const mockPatch = vi.fn<() => Promise<AutomationResponse>>()
const mockNavigate = vi.fn()

vi.mock('../services/automations-api', () => ({
  AutomationsApi: {
    patch: (...args: unknown[]) => mockPatch(...(args as [])),
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

const mockDraftAutomationWithLink: AutomationResponse = {
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
    keyword: 'EU QUERO',
    actions: [
      { type: 'PUBLIC_REPLY', text: 'Obrigado pelo seu comentário!' },
      { type: 'PRIVATE_REPLY', text: 'Enviamos mais informações no privado.' },
      { type: 'LINK', url: 'https://exemplo.com/cupom', label: 'Ver cupom' },
    ],
  },
  published: null,
  current: {
    id: 'rev-1',
    version: 1,
    name: 'Campanha de Primavera',
    target: null,
    keyword: 'EU QUERO',
    actions: [
      { type: 'PUBLIC_REPLY', text: 'Obrigado pelo seu comentário!' },
      { type: 'PRIVATE_REPLY', text: 'Enviamos mais informações no privado.' },
      { type: 'LINK', url: 'https://exemplo.com/cupom', label: 'Ver cupom' },
    ],
  },
}

const mockDraftAutomationWithEmail: AutomationResponse = {
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
    keyword: 'EU QUERO',
    actions: [
      { type: 'PUBLIC_REPLY', text: 'Obrigado pelo seu comentário!' },
      { type: 'PRIVATE_REPLY', text: 'Enviamos mais informações no privado.' },
      { type: 'CAPTURE_EMAIL', prompt: 'Qual é o seu melhor e-mail?' },
    ],
  },
  published: null,
  current: {
    id: 'rev-1',
    version: 1,
    name: 'Campanha de Primavera',
    target: null,
    keyword: 'EU QUERO',
    actions: [
      { type: 'PUBLIC_REPLY', text: 'Obrigado pelo seu comentário!' },
      { type: 'PRIVATE_REPLY', text: 'Enviamos mais informações no privado.' },
      { type: 'CAPTURE_EMAIL', prompt: 'Qual é o seu melhor e-mail?' },
    ],
  },
}

describe('FinalActionStepView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders LINK action form by default with prefilled URL and label', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <FinalActionStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomationWithLink}
        />
      </QueryClientProvider>,
    )

    await expect.element(getByTestId('final-action-type-link')).toBeInTheDocument()
    await expect.element(getByTestId('final-action-type-email')).toBeInTheDocument()
    await expect.element(getByTestId('automation-final-action-url-input')).toBeInTheDocument()
    await expect
      .element(getByTestId('automation-final-action-url-input'))
      .toHaveValue('https://exemplo.com/cupom')
    await expect.element(getByTestId('automation-final-action-label-input')).toBeInTheDocument()
    await expect
      .element(getByTestId('automation-final-action-label-input'))
      .toHaveValue('Ver cupom')
  })

  it('renders CAPTURE_EMAIL action form when existing automation has capture email action', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <FinalActionStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomationWithEmail}
        />
      </QueryClientProvider>,
    )

    await expect.element(getByTestId('automation-final-action-prompt-input')).toBeInTheDocument()
    await expect
      .element(getByTestId('automation-final-action-prompt-input'))
      .toHaveValue('Qual é o seu melhor e-mail?')
    await expect
      .element(getByTestId('automation-final-action-prompt-char-count'))
      .toHaveTextContent('27/300 caracteres')
  })

  it('allows toggling between LINK and CAPTURE_EMAIL modes', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <FinalActionStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomationWithLink}
        />
      </QueryClientProvider>,
    )

    await expect.element(getByTestId('automation-final-action-url-input')).toBeInTheDocument()

    const emailModeOption = getByTestId('final-action-type-email')
    await emailModeOption.click()

    await expect.element(getByTestId('automation-final-action-prompt-input')).toBeInTheDocument()

    const linkModeOption = getByTestId('final-action-type-link')
    await linkModeOption.click()

    await expect.element(getByTestId('automation-final-action-url-input')).toBeInTheDocument()
  })

  it('validates invalid URL format when in LINK mode', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId, getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <FinalActionStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomationWithLink}
        />
      </QueryClientProvider>,
    )

    const urlInput = getByTestId('automation-final-action-url-input')
    await urlInput.fill('url-invalida')

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    await expect
      .element(getByText('Informe uma URL válida (ex: https://seusite.com.br)'))
      .toBeInTheDocument()
    expect(mockPatch).not.toHaveBeenCalled()
  })

  it('validates prompt character limit when in CAPTURE_EMAIL mode', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId, getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <FinalActionStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomationWithEmail}
        />
      </QueryClientProvider>,
    )

    const promptInput = getByTestId('automation-final-action-prompt-input')
    const longPrompt = 'p'.repeat(301)
    await promptInput.fill(longPrompt)

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    await expect
      .element(getByText('A mensagem de captura deve ter no máximo 300 caracteres.'))
      .toBeInTheDocument()
    expect(mockPatch).not.toHaveBeenCalled()
  })

  it('saves updated LINK final action and preserves earlier reply actions in position 3', async () => {
    const queryClient = createTestQueryClient()
    mockPatch.mockResolvedValue(mockDraftAutomationWithLink)

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <FinalActionStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomationWithLink}
        />
      </QueryClientProvider>,
    )

    const urlInput = getByTestId('automation-final-action-url-input')
    await urlInput.fill('https://novosite.com.br/promo')

    const labelInput = getByTestId('automation-final-action-label-input')
    await labelInput.fill('Garantir desconto')

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    expect(mockPatch).toHaveBeenCalledWith('auto-1', {
      actions: [
        { type: 'PUBLIC_REPLY', text: 'Obrigado pelo seu comentário!' },
        { type: 'PRIVATE_REPLY', text: 'Enviamos mais informações no privado.' },
        { type: 'LINK', url: 'https://novosite.com.br/promo', label: 'Garantir desconto' },
      ],
    })
  })

  it('saves updated CAPTURE_EMAIL final action and replaces previous LINK action in sequence', async () => {
    const queryClient = createTestQueryClient()
    mockPatch.mockResolvedValue(mockDraftAutomationWithEmail)

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <FinalActionStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomationWithLink}
        />
      </QueryClientProvider>,
    )

    const emailModeOption = getByTestId('final-action-type-email')
    await emailModeOption.click()

    const promptInput = getByTestId('automation-final-action-prompt-input')
    await promptInput.fill('Informe seu e-mail para receber o cupom:')

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    expect(mockPatch).toHaveBeenCalledWith('auto-1', {
      actions: [
        { type: 'PUBLIC_REPLY', text: 'Obrigado pelo seu comentário!' },
        { type: 'PRIVATE_REPLY', text: 'Enviamos mais informações no privado.' },
        { type: 'CAPTURE_EMAIL', prompt: 'Informe seu e-mail para receber o cupom:' },
      ],
    })
  })

  it('navigates to next step /review when next button is clicked', async () => {
    const queryClient = createTestQueryClient()
    const onNextMock = vi.fn()

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <FinalActionStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomationWithLink}
          onNext={onNextMock}
        />
      </QueryClientProvider>,
    )

    const nextButton = getByTestId('automation-next-step-button')
    await nextButton.click()

    expect(onNextMock).toHaveBeenCalledTimes(1)
  })
})
