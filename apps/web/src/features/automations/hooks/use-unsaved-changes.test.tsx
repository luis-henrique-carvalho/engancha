import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useUnsavedChanges } from './use-unsaved-changes'

let mockBlockFn: ((retry: () => void) => void) | null = null
const mockUnblock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    history: {
      block: (fn: (retry: () => void) => void) => {
        mockBlockFn = fn
        return mockUnblock
      },
    },
  }),
}))

function TestComponent({ isDirty }: { isDirty: boolean }) {
  const { isBlocked, proceed, reset, UnsavedChangesDialog } = useUnsavedChanges({ isDirty })
  return (
    <div>
      <span data-testid="blocked-status">{isBlocked ? 'blocked' : 'unblocked'}</span>
      <button data-testid="proceed-btn" onClick={() => proceed?.()}>
        Proceed
      </button>
      <button data-testid="reset-btn" onClick={() => reset?.()}>
        Reset
      </button>
      <UnsavedChangesDialog />
    </div>
  )
}

describe('useUnsavedChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBlockFn = null
  })

  it('registers beforeunload listener when form is dirty', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = await render(<TestComponent isDirty={true} />)

    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))

    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('renders confirmation dialog when navigation is blocked and calls retry callback on confirm', async () => {
    const retrySpy = vi.fn()
    const { getByTestId, getByRole, getByText } = await render(
      <TestComponent isDirty={true} />,
    )

    // Trigger router block
    expect(mockBlockFn).not.toBeNull()
    mockBlockFn!(retrySpy)

    await expect.element(getByTestId('blocked-status')).toHaveTextContent('blocked')
    await expect
      .element(getByRole('heading', { name: 'Alterações não salvas' }))
      .toBeInTheDocument()
    await expect
      .element(
        getByText(
          'Você possui alterações não salvas nesta etapa. Se sair agora, os dados preenchidos serão descartados. Deseja continuar?',
        ),
      )
      .toBeInTheDocument()

    const confirmButton = getByRole('button', { name: 'Descartar e sair' })
    await confirmButton.click()

    expect(retrySpy).toHaveBeenCalledOnce()
    await expect.element(getByTestId('blocked-status')).toHaveTextContent('unblocked')
  })

  it('resets blocked state when dialog is cancelled', async () => {
    const retrySpy = vi.fn()
    const { getByRole, getByTestId } = await render(<TestComponent isDirty={true} />)

    // Trigger router block
    mockBlockFn!(retrySpy)
    await expect.element(getByTestId('blocked-status')).toHaveTextContent('blocked')

    const cancelButton = getByRole('button', { name: 'Continuar editando' })
    await cancelButton.click()

    expect(retrySpy).not.toHaveBeenCalled()
    await expect.element(getByTestId('blocked-status')).toHaveTextContent('unblocked')
  })
})
