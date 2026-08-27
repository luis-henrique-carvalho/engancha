import { createFileRoute } from '@tanstack/react-router'
import type { PaginationRequest } from '@engancha/contracts'
import { WorkspaceShell } from '@/features/workspaces/workspace-shell'
import { AutomationsHeader } from '@/features/automations/components/automations-header'
import { AutomationsListView } from '@/features/automations/views'

export const Route = createFileRoute('/automations/')({
  validateSearch: (search: Record<string, unknown>): PaginationRequest => ({
    page: typeof search.page === 'number' ? search.page : 1,
    limit: typeof search.limit === 'number' ? search.limit : 20,
  }),
  component: AutomationsIndexPage,
})

function AutomationsIndexPage() {
  const params = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <WorkspaceShell
      header={<AutomationsHeader />}
      mainClassName="flex flex-1 flex-col gap-4 sm:gap-6"
    >
      {(workspace) => (
        <AutomationsListView
          workspaceId={workspace.id}
          params={params}
          onParamsChange={(next) =>
            void navigate({
              search: { page: next.page, limit: next.limit },
            })
          }
        />
      )}
    </WorkspaceShell>
  )
}
