import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AutomationResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { IdentificationStepView } from './identification-step-view'

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

describe('IdentificationStepView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders identification form with initial values and character counter', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId, getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <IdentificationStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    await expect.element(getByTestId('automation-name-input')).toBeInTheDocument()
    await expect.element(getByTestId('automation-name-input')).toHaveValue('Campanha de Primavera')
    await expect.element(getByText('21/80 caracteres')).toBeInTheDocument()
    await expect.element(getByTestId('automation-save-step-button')).toBeInTheDocument()
    await expect.element(getByTestId('automation-next-step-button')).toBeInTheDocument()
  })

  it('updates character counter when user types', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId, getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <IdentificationStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={{
            ...mockDraftAutomation,
            current: { ...mockDraftAutomation.current!, name: null },
          }}
        />
      </QueryClientProvider>,
    )

    const input = getByTestId('automation-name-input')
    await expect.element(input).toHaveValue('')
    await expect.element(getByText('0/80 caracteres')).toBeInTheDocument()

    await input.fill('Novo Nome')
    await expect.element(input).toHaveValue('Novo Nome')
    await expect.element(getByText('9/80 caracteres')).toBeInTheDocument()
  })

  it('validates maximum length of 80 characters', async () => {
    const queryClient = createTestQueryClient()
    const { getByTestId, getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <IdentificationStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    const input = getByTestId('automation-name-input')
    const longName = 'A'.repeat(81)
    await input.fill(longName)

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    await expect
      .element(getByText('O nome da automação deve ter no máximo 80 caracteres.'))
      .toBeInTheDocument()
    expect(mockPatch).not.toHaveBeenCalled()
  })

  it('submits valid name to PATCH /automations/:id when save button is clicked', async () => {
    const queryClient = createTestQueryClient()
    const updatedAutomation = {
      ...mockDraftAutomation,
      current: { ...mockDraftAutomation.current!, name: 'Nome Salvo' },
    }
    mockPatch.mockResolvedValue(updatedAutomation)

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <IdentificationStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    const input = getByTestId('automation-name-input')
    await input.fill('Nome Salvo')

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    expect(mockPatch).toHaveBeenCalledWith('auto-1', { name: 'Nome Salvo' })
  })

  it('allows saving empty name on drafts by sending null', async () => {
    const queryClient = createTestQueryClient()
    const updatedAutomation = {
      ...mockDraftAutomation,
      current: { ...mockDraftAutomation.current!, name: null },
    }
    mockPatch.mockResolvedValue(updatedAutomation)

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <IdentificationStepView
          workspaceId="ws-1"
          automationId="auto-1"
          automation={mockDraftAutomation}
        />
      </QueryClientProvider>,
    )

    const input = getByTestId('automation-name-input')
    await input.fill('')

    const saveButton = getByTestId('automation-save-step-button')
    await saveButton.click()

    expect(mockPatch).toHaveBeenCalledWith('auto-1', { name: null })
  })

  it('navigates to next step /content when next button is clicked', async () => {
    const queryClient = createTestQueryClient()
    const onNextMock = vi.fn()

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <IdentificationStepView
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
