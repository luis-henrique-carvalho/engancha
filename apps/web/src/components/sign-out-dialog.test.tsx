import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { SignOutDialog } from './sign-out-dialog'

const navigate = vi.fn()
const signOutMock = vi.fn().mockResolvedValue({})

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signOut: () => signOutMock(),
  },
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

describe('SignOutDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign out dialog content and buttons', async () => {
    const { getByRole, getByText } = await render(<SignOutDialog open onOpenChange={vi.fn()} />)

    await expect.element(getByRole('heading', { name: 'Sair da conta' })).toBeInTheDocument()
    await expect
      .element(getByText('Sua sessão atual será encerrada neste navegador.'))
      .toBeInTheDocument()
    await expect.element(getByRole('button', { name: 'Sair' })).toBeInTheDocument()
    await expect.element(getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('calls authClient.signOut and navigates to /auth/login on confirmation', async () => {
    const { getByRole } = await render(<SignOutDialog open onOpenChange={vi.fn()} />)

    await userEvent.click(getByRole('button', { name: 'Sair' }))

    expect(signOutMock).toHaveBeenCalledOnce()
    await vi.waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({
        to: '/auth/login',
        replace: true,
      })
    })
  })

  it('does not call signOut or navigate when Cancelar is clicked', async () => {
    const { getByRole } = await render(<SignOutDialog open onOpenChange={vi.fn()} />)

    await userEvent.click(getByRole('button', { name: 'Cancelar' }))

    expect(signOutMock).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})
