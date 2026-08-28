import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AutomationResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { KeywordStepView } from './keyword-step-view'

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
    actions: [],
  },
  published: null,
  current: {
    id: 'rev-1',
    version: 1,
    name: 'Campanha de Primavera',
    target: null,
    keyword: 'EU QUERO',
    actions: [],
  },
}

describe('KeywordStepView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders keyword form with initial values, character counter, and normalization preview', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <KeywordStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    await expect.element(getByTestId('automation-keyword-input')).toBeInTheDocument()
    await expect.element(getByTestId('automation-keyword-input')).toHaveValue('EU QUERO')
    await expect
      .element(getByTestId('automation-keyword-char-count'))
      .toHaveTextContent('8/120 caracteres')
    await expect.element(getByTestId('normalized-keyword-text')).toHaveTextContent('eu quero')
    await expect.element(getByTestId('automation-save-step-button')).toBeInTheDocument()
    await expect.element(getByTestId('automation-next-step-button')).toBeInTheDocument()
  })

  it('updates character counter and normalization preview in real time when typing with accents and casing', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId, getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <KeywordStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={{
            ...mockDraftAutomation,
            current: { ...mockDraftAutomation.current!, keyword: null },
          }}
        />
      </QueryClientProvider>,
    )

    const input = getByTestId('automation-keyword-input')
    await expect.element(input).toHaveValue('')
    await expect
      .element(getByTestId('automation-keyword-char-count'))
      .toHaveTextContent('0/120 caracteres')
    await expect
      .element(
        getByText(
          'Digite uma palavra ou frase acima para visualizar como os comentários serão interpretados.',
        ),
      )
      .toBeInTheDocument()

    await input.fill('  PROMOÇÃO-VIP   2026!  ')
    await expect
      .element(getByTestId('automation-keyword-char-count'))
      .toHaveTextContent('24/120 caracteres')
    await expect
      .element(getByTestId('normalized-keyword-text'))
      .toHaveTextContent('promocao vip 2026!')
  })

  it('validates maximum length of 120 characters', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId, getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <KeywordStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    const input = getByTestId('automation-keyword-input')
    const longKeyword = 'k'.repeat(121)
    await input.fill(longKeyword)

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    await expect
      .element(getByText('A palavra-chave deve ter no máximo 120 caracteres.'))
      .toBeInTheDocument()
    expect(mockPatch).not.toHaveBeenCalled()
  })

  it('submits valid keyword to PATCH /automations/:id when save button is clicked', async () => {
    const queryClient = createTestQueryClient()
    const updatedAutomation = {
      ...mockDraftAutomation,
      current: { ...mockDraftAutomation.current!, keyword: 'QUERO' },
    }
    mockPatch.mockResolvedValue(updatedAutomation)

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <KeywordStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    const input = getByTestId('automation-keyword-input')
    await input.fill('QUERO')

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    expect(mockPatch).toHaveBeenCalledWith('auto-1', { keyword: 'QUERO' })
  })

  it('allows saving empty keyword on drafts by sending null', async () => {
    const queryClient = createTestQueryClient()
    const updatedAutomation = {
      ...mockDraftAutomation,
      current: { ...mockDraftAutomation.current!, keyword: null },
    }
    mockPatch.mockResolvedValue(updatedAutomation)

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <KeywordStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    const input = getByTestId('automation-keyword-input')
    await input.fill('')

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    expect(mockPatch).toHaveBeenCalledWith('auto-1', { keyword: null })
  })

  it('navigates to next step /public-reply when next button is clicked', async () => {
    const queryClient = createTestQueryClient()
    const onNextMock = vi.fn()

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <KeywordStepView
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
