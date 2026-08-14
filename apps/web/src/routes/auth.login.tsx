import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '../lib/auth-client'

export const Route = createFileRoute('/auth/login')({ component: LoginPage })

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const result = await authClient.signIn.email({ email, password }).catch(() => ({ error: true }))
    setLoading(false)
    if ('error' in result && result.error) {
      setError('Não foi possível entrar. Verifique os dados ou confirme seu e-mail.')
      return
    }
    await navigate({ to: '/workspace' })
  }

  async function googleLogin() {
    setError('')
    const result = await authClient.signIn.social({ provider: 'google', callbackURL: '/workspace' })
    if (result.error) setError('O acesso com Google não pôde ser concluído.')
  }

  return (
    <section className="auth-card" aria-labelledby="login-title">
      <p className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        Bem-vindo de volta
      </p>
      <h1 id="login-title">Entre no seu workspace.</h1>
      <p className="auth-lede">Use seu e-mail confirmado para continuar.</p>
      <form className="auth-form" onSubmit={submit}>
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-button" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <button className="secondary-button" type="button" onClick={googleLogin}>
        Continuar com Google
      </button>
      <div className="auth-links">
        <Link to="/auth/forgot-password">Esqueci minha senha</Link>
        <Link to="/auth/register">Criar conta</Link>
      </div>
    </section>
  )
}
