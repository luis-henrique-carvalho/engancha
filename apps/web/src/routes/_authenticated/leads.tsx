import { createFileRoute } from '@tanstack/react-router'
import { LeadsHeader, LeadsListView } from '@/features/leads/views'
import { WorkspaceShell } from '@/features/workspaces/workspace-shell'
import type { LeadListQuery } from '@engancha/contracts'

export const Route = createFileRoute('/_authenticated/leads')({
  validateSearch: (search: Record<string, unknown>): Partial<LeadListQuery> => ({
    limit: typeof search.limit === 'number' ? search.limit : 20,
    cursor: typeof search.cursor === 'string' ? search.cursor : undefined,
    query: typeof search.query === 'string' ? search.query : undefined,
    provider:
      search.provider === 'INSTAGRAM' || search.provider === 'TIKTOK'
        ? [search.provider]
        : Array.isArray(search.provider)
          ? (search.provider as ('INSTAGRAM' | 'TIKTOK')[])
          : undefined,
    mode:
      search.mode === 'REAL' || search.mode === 'SIMULATED'
        ? [search.mode]
        : Array.isArray(search.mode)
          ? (search.mode as ('REAL' | 'SIMULATED')[])
          : undefined,
    automationId: typeof search.automationId === 'string' ? search.automationId : undefined,
    tagId: typeof search.tagId === 'string' ? search.tagId : undefined,
  }),
  component: LeadsPage,
})

function LeadsPage() {
  const params = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <WorkspaceShell
      header={<LeadsHeader />}
      mainClassName="flex flex-1 flex-col gap-4 sm:gap-6"
    >
      {(workspace) => (
        <LeadsListView
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
