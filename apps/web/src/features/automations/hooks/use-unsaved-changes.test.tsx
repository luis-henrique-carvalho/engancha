import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useUnsavedChanges } from './use-unsaved-changes'

let mockBlockFn: (() => Promise<boolean>) | null = null
const mockUnblock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    history: {
      block: ({ blockerFn }: { blockerFn: () => Promise<boolean> }) => {
        mockBlockFn = blockerFn
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
      <button
        data-testid="proceed-btn"
        onClick={() => proceed?.()}
      >
        Proceed
      </button>
      <button
        data-testid="reset-btn"
        onClick={() => reset?.()}
      >
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

  it('renders confirmation dialog when navigation is blocked and proceeds on confirm', async () => {
    const { getByTestId, getByRole, getByText } = await render(<TestComponent isDirty={true} />)

    expect(mockBlockFn).not.toBeNull()
    const navigation = mockBlockFn!()

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

    await expect(navigation).resolves.toBe(false)
    await expect.element(getByTestId('blocked-status')).toHaveTextContent('unblocked')
  })

  it('resets blocked state when dialog is cancelled', async () => {
    const { getByRole, getByTestId } = await render(<TestComponent isDirty={true} />)

    const navigation = mockBlockFn!()
    await expect.element(getByTestId('blocked-status')).toHaveTextContent('blocked')

    const cancelButton = getByRole('button', { name: 'Continuar editando' })
    await cancelButton.click()

    await expect(navigation).resolves.toBe(true)
    await expect.element(getByTestId('blocked-status')).toHaveTextContent('unblocked')
  })
})
