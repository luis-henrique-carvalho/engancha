import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '../lib/auth-client'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/auth/verify-email')({
  validateSearch: (search: Record<string, unknown>) => ({ email: String(search.email ?? '') }),
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { email } = Route.useSearch()
  const [message, setMessage] = useState('Confira sua caixa de entrada para confirmar o endereço.')
  const [loading, setLoading] = useState(false)

  async function resend() {
    setLoading(true)
    const result = await authClient
      .sendVerificationEmail({ email, callbackURL: '/workspace' })
      .catch(() => ({ error: true }))
    setLoading(false)
    setMessage(
      result.error
        ? 'Aguarde alguns minutos e tente novamente.'
        : 'Se o endereço puder receber mensagens, um novo link foi enviado.',
    )
  }

  return (
    <section className="auth-card" aria-labelledby="verify-title">
      <p className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        Quase lá
      </p>
      <h1 id="verify-title">Confirme seu e-mail.</h1>
      <p className="auth-lede">{message}</p>
      <p className="muted">{email || 'Seu endereço'}</p>
      <Button className="primary-button" onClick={resend} disabled={loading}>
        {loading ? 'Enviando…' : 'Reenviar confirmação'}
      </Button>
      <div className="auth-links">
        <Link to="/auth/login">Voltar para o login</Link>
      </div>
    </section>
  )
}
