import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
import { SignUpForm } from './sign-up-form'

const navigateMock = vi.fn()
const signUpEmailMock = vi.fn().mockResolvedValue({ data: {} })

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signUp: {
      email: (...args: unknown[]) => signUpEmailMock(...args),
    },
  },
  webCallbackUrl: (path: string) => `http://localhost:3000${path}`,
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe('SignUpForm', () => {
  let screen: RenderResult
  let nameInput: Locator
  let emailInput: Locator
  let passwordInput: Locator
  let submitButton: Locator

  beforeEach(async () => {
    vi.clearAllMocks()

    screen = await render(<SignUpForm />)
    nameInput = screen.getByRole('textbox', { name: /^Nome$/i })
    emailInput = screen.getByRole('textbox', { name: /^E-mail$/i })
    passwordInput = screen.getByLabelText(/^Senha$/i)
    submitButton = screen.getByRole('button', { name: /^Criar conta$/i })
  })

  it('renders fields and submit button', async () => {
    await expect.element(nameInput).toBeInTheDocument()
    await expect.element(emailInput).toBeInTheDocument()
    await expect.element(passwordInput).toBeInTheDocument()
    await expect.element(submitButton).toBeInTheDocument()
  })

  it('shows validation messages when submitting empty form', async () => {
    await userEvent.click(submitButton)

    await expect.element(screen.getByText('Informe seu nome.')).toBeInTheDocument()
    await expect.element(screen.getByText('Informe seu e-mail.')).toBeInTheDocument()
    await expect
      .element(screen.getByText('A senha deve ter ao menos 8 caracteres.'))
      .toBeInTheDocument()
  })

  it('submits registration and navigates to verify email', async () => {
    await userEvent.fill(nameInput, 'Luis Silva')
    await userEvent.fill(emailInput, 'luis@example.com')
    await userEvent.fill(passwordInput, 'senha-forte-123')

    await userEvent.click(submitButton)

    expect(signUpEmailMock).toHaveBeenCalledWith({
      name: 'Luis Silva',
      email: 'luis@example.com',
      password: 'senha-forte-123',
      callbackURL: 'http://localhost:3000/workspace',
    })

    await vi.waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({
        to: '/auth/verify-email',
        search: { email: 'luis@example.com' },
      })
    })
  })
})
