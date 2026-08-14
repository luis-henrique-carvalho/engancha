import { createFileRoute } from '@tanstack/react-router'
import { UsersView } from '../features/users/views'
import { WorkspaceShell } from '../features/workspaces/workspace-shell'

export const Route = createFileRoute('/users')({ component: UsersPage })

function UsersPage() {
  return (
    <WorkspaceShell>
      {(workspace) => (
        <UsersView
          workspaceId={workspace.id}
          canManage={workspace.role === 'owner' || workspace.role === 'admin'}
        />
      )}
    </WorkspaceShell>
  )
}
