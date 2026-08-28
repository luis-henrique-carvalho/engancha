import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
import { UserAuthForm } from './user-auth-form'

const navigateMock = vi.fn()
const signInEmailMock = vi.fn().mockResolvedValue({ data: {} })
const signInSocialMock = vi.fn().mockResolvedValue({ data: {} })

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => signInEmailMock(...args),
      social: (...args: unknown[]) => signInSocialMock(...args),
    },
  },
  webCallbackUrl: (path: string) => `http://localhost:3000${path}`,
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Link: ({
      children,
      to,
      className,
      ...rest
    }: {
      children?: React.ReactNode
      to: string
      className?: string
    }) => (
      <a
        href={to}
        className={className}
        {...rest}
      >
        {children}
      </a>
    ),
  }
})

describe('UserAuthForm', () => {
  let screen: RenderResult
  let emailInput: Locator
  let passwordInput: Locator
  let signInButton: Locator
  let forgotPasswordLink: Locator

  beforeEach(async () => {
    vi.clearAllMocks()
    screen = await render(<UserAuthForm />)
    emailInput = screen.getByRole('textbox', { name: /^E-mail$/i })
    passwordInput = screen.getByLabelText(/^Senha$/i)
    signInButton = screen.getByRole('button', { name: /^Entrar$/i })
    forgotPasswordLink = screen.getByText(/^Esqueci minha senha$/i)
  })

  it('renders fields, submit button, and forgot password link', async () => {
    await expect.element(emailInput).toBeInTheDocument()
    await expect.element(passwordInput).toBeInTheDocument()
    await expect.element(signInButton).toBeInTheDocument()
    await expect.element(forgotPasswordLink).toBeInTheDocument()
  })

  it('shows validation messages when submitting empty form', async () => {
    await userEvent.click(signInButton)

    await expect.element(screen.getByText('Informe seu e-mail.')).toBeInTheDocument()
    await expect.element(screen.getByText('Informe sua senha.')).toBeInTheDocument()
  })

  it('authenticates and navigates to workspace on success', async () => {
    await userEvent.fill(emailInput, 'user@example.com')
    await userEvent.fill(passwordInput, 'password123')

    await userEvent.click(signInButton)

    expect(signInEmailMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    })

    await vi.waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/workspace' })
    })
  })
})
