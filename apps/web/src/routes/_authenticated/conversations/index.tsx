import { createFileRoute } from '@tanstack/react-router'
import { ConversationsHeader, ConversationsListView } from '@/features/conversations/views'
import { WorkspaceShell } from '@/features/workspaces/workspace-shell'
import type { ConversationListQuery } from '@engancha/contracts'

export const Route = createFileRoute('/_authenticated/conversations/')({
  validateSearch: (search: Record<string, unknown>): Partial<ConversationListQuery> => ({
    page: typeof search.page === 'number' ? search.page : 1,
    limit: typeof search.limit === 'number' ? search.limit : 20,
    query: typeof search.query === 'string' ? search.query : undefined,
    hasLead:
      search.hasLead === true || search.hasLead === 'true'
        ? true
        : search.hasLead === false || search.hasLead === 'false'
          ? false
          : undefined,
    automationId: typeof search.automationId === 'string' ? search.automationId : undefined,
    tagId: typeof search.tagId === 'string' ? search.tagId : undefined,
  }),
  component: ConversationsPage,
})

function ConversationsPage() {
  const params = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <WorkspaceShell
      header={<ConversationsHeader />}
      mainClassName="flex flex-1 flex-col gap-4 sm:gap-6"
    >
      {(workspace) => (
        <ConversationsListView
          workspaceId={workspace.id}
          params={params}
          onParamsChange={(next) =>
            void navigate({
              search: next,
            })
          }
        />
      )}
    </WorkspaceShell>
  )
}
