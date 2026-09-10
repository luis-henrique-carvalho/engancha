import { createFileRoute } from '@tanstack/react-router'
import { ConversationDetailHeader, ConversationDetailView } from '@/features/conversations/views'
import { WorkspaceShell } from '@/features/workspaces/workspace-shell'

export const Route = createFileRoute('/_authenticated/conversations/$conversationId')({
  component: ConversationDetailPage,
})

function ConversationDetailPage() {
  const { conversationId } = Route.useParams()

  return (
    <WorkspaceShell
      header={<ConversationDetailHeader />}
      mainClassName="flex flex-1 flex-col gap-4 sm:gap-6"
    >
      {(workspace) => (
        <ConversationDetailView
          workspaceId={workspace.id}
          conversationId={conversationId}
        />
      )}
    </WorkspaceShell>
  )
}
