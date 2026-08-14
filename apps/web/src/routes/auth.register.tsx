import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '../lib/auth-client'

export const Route = createFileRoute('/auth/register')({ component: RegisterPage })

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const result = await authClient.signUp.email(form).catch(() => ({ error: true }))
    setLoading(false)
    if ('error' in result && result.error) {
      setError('Não foi possível criar a conta. Verifique os dados informados.')
      return
    }
    await navigate({ to: '/auth/verify-email', search: { email: form.email } })
  }

  return (
    <section className="auth-card" aria-labelledby="register-title">
      <p className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        Comece por aqui
      </p>
      <h1 id="register-title">Crie seu acesso.</h1>
      <p className="auth-lede">Você receberá um link para confirmar este endereço.</p>
      <form className="auth-form" onSubmit={submit}>
        <label>
          Nome
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
            autoComplete="name"
          />
        </label>
        <label>
          E-mail
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-button" disabled={loading}>
          {loading ? 'Criando…' : 'Criar conta'}
        </button>
      </form>
      <p className="auth-footnote">
        Já tem acesso? <Link to="/auth/login">Entrar</Link>
      </p>
    </section>
  )
}
