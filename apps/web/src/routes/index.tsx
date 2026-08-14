import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="foundation-shell">
      <div className="grain" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="/" aria-label="Engancha home">
          <span className="brand-mark">E</span>
          <span>engancha</span>
        </a>
        <span className="build-label">LOCAL / 001</span>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Environment ready
          </p>
          <h1 id="page-title">
            Make every
            <em>interaction</em>
            count.
          </h1>
          <p className="lede">
            The local foundation is online. Web, API, worker, and shared contracts now have a place
            to grow together.
          </p>
          <div className="status-row" aria-label="Environment status">
            <span className="status-chip">
              <span className="status-pulse" aria-hidden="true" />
              Web shell online
            </span>
            <span className="status-note">TanStack Start · port 3000</span>
          </div>
          <div className="hero-actions">
            <Link className="primary-button" to="/auth/register">
              Criar meu acesso
            </Link>
            <Link className="text-button" to="/auth/login">
              Já tenho uma conta
            </Link>
          </div>
        </div>

        <div className="signal-card" aria-label="Foundation status summary">
          <div className="signal-card-header">
            <span>FOUNDATION STATUS</span>
            <span className="signal-card-index">01 / 04</span>
          </div>
          <div className="signal-ring">
            <span>OK</span>
          </div>
          <div className="signal-card-footer">
            <span>Ready for the next slice</span>
            <span className="arrow" aria-hidden="true">
              ↗
            </span>
          </div>
        </div>
      </section>

      <footer className="footer-bar">
        <span>ENGANCHA / LOCAL FOUNDATION</span>
        <span>NO API CONNECTION REQUIRED</span>
      </footer>
    </main>
  )
}
