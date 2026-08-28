import { createFileRoute } from '@tanstack/react-router'
import type { AutomationListRequest } from '@engancha/contracts'
import { WorkspaceShell } from '@/features/workspaces/workspace-shell'
import { AutomationsHeader } from '@/features/automations/components/automations-header'
import { AutomationsListView } from '@/features/automations/views/automations-list-view'
import { useCreateAutomation } from '@/features/automations/hooks/use-create-automation'

function selectedStatuses(value: unknown): AutomationListRequest['status'] {
  const allowed = ['ACTIVE', 'DRAFT', 'PAUSED'] as const
  const values = Array.isArray(value) ? value : [value]
  const selected = values.filter(
    (item): item is (typeof allowed)[number] =>
      typeof item === 'string' && (allowed as readonly string[]).includes(item),
  )
  return selected.length ? selected : undefined
}

export const Route = createFileRoute('/automations/')({
  validateSearch: (search: Record<string, unknown>): AutomationListRequest => ({
    page: typeof search.page === 'number' ? search.page : 1,
    limit: typeof search.limit === 'number' ? search.limit : 20,
    query: typeof search.query === 'string' ? search.query : undefined,
    status: selectedStatuses(search.status),
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
        <AutomationsPageContent
          workspaceId={workspace.id}
          params={params}
          navigate={navigate}
        />
      )}
    </WorkspaceShell>
  )
}

function AutomationsPageContent({
  workspaceId,
  params,
  navigate,
}: {
  workspaceId: string
  params: AutomationListRequest
  navigate: (opts: any) => Promise<void>
}) {
  const createMutation = useCreateAutomation(workspaceId)

  const handleCreate = async () => {
    try {
      const newAutomation = await createMutation.mutateAsync({})
      void navigate({
        to: `/automations/${newAutomation.id}/identification`,
      })
    } catch {
      // Global QueryCache / handleServerError notifies
    }
  }

  return (
    <AutomationsListView
      workspaceId={workspaceId}
      params={params}
      onParamsChange={(next) =>
        void navigate({
          search: {
            page: next.page,
            limit: next.limit,
            query: next.query,
            status: next.status,
          },
        })
      }
      onCreateClick={handleCreate}
      isCreating={createMutation.isPending}
    />
  )
}
