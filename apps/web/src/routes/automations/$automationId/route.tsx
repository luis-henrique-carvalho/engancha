import { createFileRoute } from '@tanstack/react-router'
import { WorkspaceShell } from '@/features/workspaces/workspace-shell'
import { AutomationsHeader } from '@/features/automations/components/automations-header'
import { AutomationEditorLayoutView } from '@/features/automations/views'

export const Route = createFileRoute('/automations/$automationId')({
  component: AutomationEditorRoutePage,
})

function AutomationEditorRoutePage() {
  const { automationId } = Route.useParams()

  return (
    <WorkspaceShell
      header={<AutomationsHeader />}
      mainClassName="flex flex-1 flex-col gap-4 sm:gap-6"
    >
      {(workspace) => (
        <AutomationEditorLayoutView workspaceId={workspace.id} automationId={automationId} />
      )}
    </WorkspaceShell>
  )
}
