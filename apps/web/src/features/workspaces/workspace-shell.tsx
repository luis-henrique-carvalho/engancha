import { useNavigate } from '@tanstack/react-router'
import type { ActiveWorkspaceResponse } from '@engancha/contracts'
import { authClient } from '@/lib/auth-client'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { useWorkspace } from './components/workspace-provider'

export function WorkspaceShell({
  children,
  header,
  fixed = false,
  mainClassName = 'gap-6',
}: {
  children: (workspace: ActiveWorkspaceResponse) => React.ReactNode
  header?: React.ReactNode
  fixed?: boolean
  mainClassName?: string
}) {
  const navigate = useNavigate()
  const { workspace } = useWorkspace()

  if (!workspace) {
    throw new Error('WorkspaceShell deve ser renderizado após o carregamento do workspace.')
  }

  return (
    <>
      {header ?? (
        <Header fixed>
          <div className="me-auto min-w-0">
            <p className="truncate text-sm font-semibold">{workspace.name}</p>
            <p className="truncate text-xs text-muted-foreground">{workspace.slug}</p>
          </div>
          <ThemeSwitch />
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              void authClient.signOut().then(() => navigate({ to: '/auth/login', replace: true }))
            }
          >
            Sair
          </Button>
        </Header>
      )}
      <Main
        fixed={fixed}
        className={mainClassName}
      >
        {children(workspace)}
      </Main>
    </>
  )
}
