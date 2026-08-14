import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api-client'
import { authClient } from '../lib/auth-client'
import type { ActiveWorkspaceResponse } from '@engancha/contracts'

export const Route = createFileRoute('/workspace')({ component: WorkspacePage })

function WorkspacePage() {
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState<ActiveWorkspaceResponse>()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  async function load() {
    setLoading(true)
    setError('')
    try {
      const value = await apiFetch<ActiveWorkspaceResponse>('/workspaces/bootstrap', {
        method: 'POST',
      })
      setWorkspace(value)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar seu workspace.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [])
  async function logout() {
    await authClient.signOut()
    await navigate({ to: '/auth/login' })
  }
  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <Link to="/" className="brand">
          <span className="brand-mark">E</span>
          <span>engancha</span>
        </Link>
        {workspace && (
          <div className="workspace-pill">
            <span className="status-pulse" aria-hidden="true" />
            {workspace.name}
          </div>
        )}
        <button className="text-button" onClick={logout}>
          Sair
        </button>
      </header>
      <section className="workspace-content" aria-live="polite">
        {loading && <p className="muted">Preparando seu workspace…</p>}
        {error && (
          <div className="state-card">
            <p className="form-error" role="alert">
              {error}
            </p>
            <button className="primary-button" onClick={load}>
              Tentar novamente
            </button>
          </div>
        )}
        {workspace && (
          <div className="welcome-card">
            <p className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              Workspace ativo
            </p>
            <h1>{workspace.name}</h1>
            <p className="auth-lede">
              Seu contexto está protegido e pronto para receber as próximas automações.
            </p>
            <span className="role-label">{workspace.role}</span>
          </div>
        )}
      </section>
    </main>
  )
}
