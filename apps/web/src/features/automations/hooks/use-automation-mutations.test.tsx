import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AutomationResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { toast } from 'sonner'
import { useAutomationMutations } from './use-automation-mutations'
import { automationsKeys } from '../services/automations-query-keys'

const mockPatch = vi.fn<() => Promise<AutomationResponse>>()

vi.mock('../services/automations-api', () => ({
  AutomationsApi: {
    patch: (...args: unknown[]) => mockPatch(...(args as [])),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function TestMutationsComponent({
  workspaceId,
  automationId,
  onTrigger,
}: {
  workspaceId: string
  automationId: string
  onTrigger?: (mutations: ReturnType<typeof useAutomationMutations>) => void
}) {
  const mutations = useAutomationMutations(workspaceId, automationId)
  return (
    <div>
      <button
        type="button"
        data-testid="trigger-btn"
        onClick={() => {
          onTrigger?.(mutations)
        }}
      >
        Trigger
      </button>
      <span data-testid="is-saving">{mutations.isSaving ? 'saving' : 'idle'}</span>
    </div>
  )
}

describe('useAutomationMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('patches automation, updates detail cache, invalidates list cache and shows toast', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })

    const initialAutomation: AutomationResponse = {
      id: 'auto-123',
      status: 'DRAFT',
      createdAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
      hasUnpublishedChanges: false,
      executionCount: 0,
      leadCount: 0,
      draft: {
        id: 'rev-1',
        version: 1,
        name: null,
        target: null,
        keyword: null,
        actions: [],
      },
      published: null,
      current: {
        id: 'rev-1',
        version: 1,
        name: null,
        target: null,
        keyword: null,
        actions: [],
      },
    }

    const updatedAutomation: AutomationResponse = {
      ...initialAutomation,
      draft: {
        ...initialAutomation.draft!,
        name: 'Automação Atualizada',
      },
      current: {
        ...initialAutomation.current!,
        name: 'Automação Atualizada',
      },
    }

    queryClient.setQueryData(automationsKeys.detail('ws-1', 'auto-123'), initialAutomation)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockPatch.mockResolvedValue(updatedAutomation)

    let capturedMutations: ReturnType<typeof useAutomationMutations> | undefined

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <TestMutationsComponent
          workspaceId="ws-1"
          automationId="auto-123"
          onTrigger={(m) => {
            capturedMutations = m
          }}
        />
      </QueryClientProvider>,
    )

    await getByTestId('trigger-btn').click()
    expect(capturedMutations).toBeDefined()

    const result = await capturedMutations!.patchAutomation({ name: 'Automação Atualizada' })

    expect(mockPatch).toHaveBeenCalledWith('auto-123', { name: 'Automação Atualizada' })
    expect(result).toEqual(updatedAutomation)

    // Direct cache update check
    const cachedDetail = queryClient.getQueryData<AutomationResponse>(
      automationsKeys.detail('ws-1', 'auto-123'),
    )
    expect(cachedDetail).toEqual(updatedAutomation)

    // Invalidation check
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: automationsKeys.lists('ws-1'),
    })

    // Success feedback
    expect(toast.success).toHaveBeenCalledWith('Etapa salva com sucesso')
  })
})
