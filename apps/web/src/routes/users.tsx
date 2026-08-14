import { createFileRoute } from '@tanstack/react-router'
import { UsersHeader, UsersView } from '../features/users/views'
import { WorkspaceShell } from '../features/workspaces/workspace-shell'
import type { WorkspaceMembersListRequest } from '@engancha/contracts'

function selectedValues<T extends string>(value: unknown, allowed: readonly T[]): T[] | undefined {
  const values = Array.isArray(value) ? value : [value]
  const selected = values.filter(
    (item): item is T => typeof item === 'string' && allowed.includes(item as T),
  )
  return selected.length ? selected : undefined
}

export const Route = createFileRoute('/users')({
  validateSearch: (search: Record<string, unknown>): WorkspaceMembersListRequest => ({
    page: typeof search.page === 'number' ? search.page : 1,
    limit: typeof search.limit === 'number' ? search.limit : 20,
    query: typeof search.query === 'string' ? search.query : undefined,
    role: selectedValues(search.role, ['owner', 'admin', 'member']),
    status: selectedValues(search.status, ['active', 'invited']),
  }),
  component: UsersPage,
})

function UsersPage() {
  const params = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <WorkspaceShell header={<UsersHeader />} mainClassName="flex flex-1 flex-col gap-4 sm:gap-6">
      {(workspace) => (
        <UsersView
          workspaceId={workspace.id}
          canManage={workspace.role === 'owner' || workspace.role === 'admin'}
          params={params}
          onParamsChange={(next) =>
            void navigate({
              search: { ...next, query: next.query, role: next.role, status: next.status },
            })
          }
        />
      )}
    </WorkspaceShell>
  )
}
