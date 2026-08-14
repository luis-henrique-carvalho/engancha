import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth')({ component: AuthLayout })

function AuthLayout() {
  return (
    <main className="auth-shell">
      <div className="auth-orbit" aria-hidden="true" />
      <header className="auth-header">
        <Link to="/" className="brand" aria-label="Engancha home">
          <span className="brand-mark">E</span>
          <span>engancha</span>
        </Link>
        <span className="build-label">ACCESS / FASE 02</span>
      </header>
      <Outlet />
    </main>
  )
}
