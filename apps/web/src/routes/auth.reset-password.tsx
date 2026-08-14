import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '../lib/auth-client'

export const Route = createFileRoute('/auth/reset-password')({ component: ResetPasswordPage })

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const token = new URLSearchParams(window.location.search).get('token') ?? ''
    const result = await authClient
      .resetPassword({ newPassword: password, token })
      .catch(() => ({ error: true }))
    setLoading(false)
    if (result.error) {
      setError('Este link não é válido ou expirou.')
      return
    }
    setMessage('Senha atualizada.')
    setTimeout(() => void navigate({ to: '/auth/login' }), 700)
  }
  return (
    <section className="auth-card" aria-labelledby="reset-title">
      <p className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        Novo começo
      </p>
      <h1 id="reset-title">Defina uma nova senha.</h1>
      <form className="auth-form" onSubmit={submit}>
        <label>
          Nova senha
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="success-message" role="status">
            {message}
          </p>
        )}
        <button className="primary-button" disabled={loading}>
          {loading ? 'Salvando…' : 'Atualizar senha'}
        </button>
      </form>
      <Link to="/auth/login">Voltar para o login</Link>
    </section>
  )
}
