import { Outlet } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkspaceProvider, useWorkspace } from '../components/workspace-provider'
import { ApiClientError } from '@/lib/api-client'

export function AuthenticatedWorkspaceRoute() {
  return (
    <WorkspaceProvider>
      <WorkspaceRouteContent />
    </WorkspaceProvider>
  )
}

function WorkspaceRouteContent() {
  const { error, isLoading, retry, setWorkspace, user, workspace } = useWorkspace()

  if (isLoading) {
    return <WorkspaceState title="Preparando seu workspace…" />
  }

  if (!workspace || !user || error) {
    const status = error instanceof ApiClientError ? error.status : undefined
    const title =
      status === 403
        ? 'Confirme seu e-mail para acessar o produto.'
        : status === 409
          ? 'Seu contexto de workspace ainda não está disponível.'
          : status === 401
            ? 'Entre novamente para continuar.'
            : 'Não foi possível carregar o workspace.'

    return (
      <WorkspaceState title={title}>
        <Button onClick={retry}>Tentar novamente</Button>
      </WorkspaceState>
    )
  }

  return (
    <AuthenticatedLayout
      user={user}
      workspace={workspace}
      onWorkspaceChange={setWorkspace}
    >
      <Outlet />
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
        {children ? <CardContent>{children}</CardContent> : null}
      </Card>
    </main>
  )
}
