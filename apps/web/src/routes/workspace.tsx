import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { ActiveWorkspaceResponse } from '@engancha/contracts'
import { authClient } from '../lib/auth-client'
import { ApiClientError, apiFetch } from '../lib/api-client'
import { AuthenticatedLayout } from '../components/layout/authenticated-layout'
import { Header } from '../components/layout/header'
import { Main } from '../components/layout/main'
import { ThemeSwitch } from '../components/theme-switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/workspace')({ component: WorkspacePage })

function WorkspacePage() {
  const navigate = useNavigate()
  const session = authClient.useSession()
  const [workspace, setWorkspace] = useState<ActiveWorkspaceResponse>()
  const [error, setError] = useState<ApiClientError | Error>()
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (session.isPending) return

    if (!session.data?.user) {
      setLoading(false)
      setError(new ApiClientError('Sua sessão não está disponível.', 401))
      void navigate({ to: '/auth/login', replace: true })
      return
    }

    let cancelled = false
    setLoading(true)
    setError(undefined)

    void apiFetch<ActiveWorkspaceResponse>('/workspaces/bootstrap', {
      method: 'POST',
    })
      .then((value) => {
        if (!cancelled) setWorkspace(value)
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause : new Error('Não foi possível preparar o workspace.'),
          )
          if (cause instanceof ApiClientError && cause.status === 401) {
            void navigate({ to: '/auth/login', replace: true })
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [attempt, navigate, session.data?.user?.id, session.isPending])

  async function logout() {
    await authClient.signOut()
    await navigate({ to: '/auth/login', replace: true })
  }

  if (session.isPending || loading) {
    return <WorkspaceState title="Preparando seu workspace…" />
  }

  if (!workspace || error) {
    const status = error instanceof ApiClientError ? error.status : undefined
    const message =
      status === 403
        ? 'Confirme seu e-mail para acessar o produto.'
        : status === 409
          ? 'Seu contexto de workspace ainda não está disponível.'
          : status === 401
            ? 'Entre novamente para continuar.'
            : 'Não foi possível carregar o workspace.'

    return (
      <WorkspaceState title={message}>
        {status === 401 ? (
          <Button asChild>
            <Link to="/auth/login">Ir para o login</Link>
          </Button>
        ) : (
          <Button onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</Button>
        )}
      </WorkspaceState>
    )
  }

  const user = session.data?.user
  const sidebarUser = {
    name: user?.name || 'Minha conta',
    email: user?.email || '',
    image: user?.image,
  }

  return (
    <AuthenticatedLayout user={sidebarUser} workspace={workspace}>
      <Header fixed>
        <div className="me-auto min-w-0">
          <p className="truncate text-sm font-semibold">{workspace.name}</p>
          <p className="truncate text-xs text-muted-foreground">{workspace.slug}</p>
        </div>
        <ThemeSwitch />
        <Button variant="ghost" size="sm" onClick={() => void logout()}>
          Sair
        </Button>
      </Header>
      <Main fixed className="gap-6">
        <Card>
          <CardHeader>
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Workspace ativo
            </p>
            <CardTitle>{workspace.name}</CardTitle>
            <CardDescription>
              Este é o contexto protegido da sua conta. As próximas automações serão associadas a
              este workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {workspace.role}
            </span>
          </CardContent>
        </Card>
      </Main>
    </AuthenticatedLayout>
  )
}

function WorkspaceState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Você pode tentar novamente ou voltar para o fluxo de acesso.
          </CardDescription>
        </CardHeader>
        {children && <CardContent>{children}</CardContent>}
      </Card>
    </main>
  )
}
