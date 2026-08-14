import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { createFileRoute } from '@tanstack/react-router'
import { WorkspaceShell } from '../features/workspaces/workspace-shell'

export const Route = createFileRoute('/workspace')({ component: WorkspacePage })

function WorkspacePage() {
  return (
    <WorkspaceShell>
      {(workspace) => (
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
      )}
    </WorkspaceShell>
  )
}
