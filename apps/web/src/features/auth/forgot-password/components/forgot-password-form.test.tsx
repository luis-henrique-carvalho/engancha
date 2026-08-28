import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { userEvent, type Locator } from 'vitest/browser'
import { ForgotPasswordForm } from './forgot-password-form'

const requestPasswordResetMock = vi.fn().mockResolvedValue({})

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    requestPasswordReset: (...args: unknown[]) => requestPasswordResetMock(...args),
  },
  webCallbackUrl: (path: string) => `http://localhost:3000${path}`,
}))

describe('ForgotPasswordForm', () => {
  let screen: RenderResult
  let emailInput: Locator
  let submitButton: Locator

  beforeEach(async () => {
    vi.clearAllMocks()

    screen = await render(<ForgotPasswordForm />)
    emailInput = screen.getByRole('textbox', { name: /^E-mail$/i })
    submitButton = screen.getByRole('button', { name: /^Enviar instruções$/i })
  })

  it('renders email field and submit button', async () => {
    await expect.element(emailInput).toBeInTheDocument()
    await expect.element(submitButton).toBeInTheDocument()
  })

  it('shows validation when submitting empty form', async () => {
    await userEvent.click(submitButton)
    await expect.element(screen.getByText(/^Informe seu e-mail\.$/i)).toBeInTheDocument()
  })

  it('submits password reset request and shows confirmation message', async () => {
    await userEvent.fill(emailInput, 'user@example.com')
    await userEvent.click(submitButton)

    expect(requestPasswordResetMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      redirectTo: 'http://localhost:3000/auth/reset-password',
    })

    await expect
      .element(
        screen.getByText(
          'Se este endereço estiver cadastrado, você receberá instruções em alguns instantes.',
        ),
      )
      .toBeInTheDocument()
  })
})
