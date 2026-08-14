import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient, webCallbackUrl } from '../lib/auth-client'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export const Route = createFileRoute('/auth/forgot-password')({ component: ForgotPasswordPage })

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    await authClient
      .requestPasswordReset({ email, redirectTo: webCallbackUrl('/auth/reset-password') })
      .catch(() => undefined)
    setLoading(false)
    setMessage('Se este endereço estiver cadastrado, você receberá instruções em alguns instantes.')
  }
  return (
    <section className="auth-card" aria-labelledby="forgot-title">
      <p className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        Recuperação
      </p>
      <h1 id="forgot-title">Recupere o acesso.</h1>
      <p className="auth-lede">Informe o e-mail da sua conta.</p>
      <form className="auth-form" onSubmit={submit}>
        <Label htmlFor="forgot-email">
          E-mail
          <Input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </Label>
        {message && (
          <p className="success-message" role="status">
            {message}
          </p>
        )}
        <Button className="primary-button" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar instruções'}
        </Button>
      </form>
      <Link to="/auth/login">Voltar para o login</Link>
    </section>
  )
}
