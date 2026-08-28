import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AutomationResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { PublicReplyStepView } from './public-reply-step-view'

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

describe('PublicReplyStepView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders public reply form with initial values and character counter', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <PublicReplyStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    await expect.element(getByTestId('automation-public-reply-input')).toBeInTheDocument()
    await expect
      .element(getByTestId('automation-public-reply-input'))
      .toHaveValue('Obrigado pelo seu comentário!')
    await expect
      .element(getByTestId('automation-public-reply-char-count'))
      .toHaveTextContent('29/1000 caracteres')
    await expect.element(getByTestId('automation-save-step-button')).toBeInTheDocument()

    await expect.element(getByTestId('automation-next-step-button')).toBeInTheDocument()
  })

  it('updates character counter in real time when user types', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <PublicReplyStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={{
            ...mockDraftAutomation,
            current: { ...mockDraftAutomation.current!, actions: [] },
          }}
        />
      </QueryClientProvider>,
    )

    const textarea = getByTestId('automation-public-reply-input')
    await expect.element(textarea).toHaveValue('')
    await expect
      .element(getByTestId('automation-public-reply-char-count'))
      .toHaveTextContent('0/1000 caracteres')

    await textarea.fill('Resposta rápida de teste')
    await expect
      .element(getByTestId('automation-public-reply-char-count'))
      .toHaveTextContent('24/1000 caracteres')
  })

  it('validates maximum length of 1000 characters', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId, getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <PublicReplyStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    const textarea = getByTestId('automation-public-reply-input')
    const longText = 'x'.repeat(1001)
    await textarea.fill(longText)

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    await expect
      .element(getByText('A resposta pública deve ter no máximo 1.000 caracteres.'))
      .toBeInTheDocument()
    expect(mockPatch).not.toHaveBeenCalled()
  })

  it('saves updated public reply and preserves other actions in canonical order', async () => {
    const queryClient = createTestQueryClient()
    mockPatch.mockResolvedValue(mockDraftAutomation)

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <PublicReplyStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    const textarea = getByTestId('automation-public-reply-input')
    await textarea.fill('Novo texto de resposta pública')

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    expect(mockPatch).toHaveBeenCalledWith('auto-1', {
      actions: [
        { type: 'PUBLIC_REPLY', text: 'Novo texto de resposta pública' },
        { type: 'PRIVATE_REPLY', text: 'Enviamos mais informações no privado.' },
        { type: 'LINK', url: 'https://exemplo.com/cupom', label: 'Ver cupom' },
      ],
    })
  })

  it('removes public reply from actions payload when input is emptied', async () => {
    const queryClient = createTestQueryClient()
    mockPatch.mockResolvedValue(mockDraftAutomation)

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <PublicReplyStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    const textarea = getByTestId('automation-public-reply-input')
    await textarea.fill('')

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    expect(mockPatch).toHaveBeenCalledWith('auto-1', {
      actions: [
        { type: 'PRIVATE_REPLY', text: 'Enviamos mais informações no privado.' },
        { type: 'LINK', url: 'https://exemplo.com/cupom', label: 'Ver cupom' },
      ],
    })
  })

  it('navigates to next step /direct-message when next button is clicked', async () => {
    const queryClient = createTestQueryClient()
    const onNextMock = vi.fn()

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <PublicReplyStepView
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
