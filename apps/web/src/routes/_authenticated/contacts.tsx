import { createFileRoute } from '@tanstack/react-router'
import { ContactsHeader, ContactsListView } from '@/features/contacts/views'
import { WorkspaceShell } from '@/features/workspaces/workspace-shell'
import type { ContactListQuery } from '@engancha/contracts'

export const Route = createFileRoute('/_authenticated/contacts')({
  validateSearch: (search: Record<string, unknown>): Partial<ContactListQuery> => ({
    page: typeof search.page === 'number' ? search.page : 1,
    limit: typeof search.limit === 'number' ? search.limit : 20,
    query: typeof search.query === 'string' ? search.query : undefined,
    provider:
      search.provider === 'INSTAGRAM' || search.provider === 'TIKTOK'
        ? [search.provider]
        : Array.isArray(search.provider)
          ? (search.provider as ('INSTAGRAM' | 'TIKTOK')[])
          : undefined,
    leadState:
      search.leadState === 'LEAD' || search.leadState === 'NOT_LEAD' || search.leadState === 'ALL'
        ? search.leadState
        : undefined,
    tagId: typeof search.tagId === 'string' ? search.tagId : undefined,
  }),
  component: ContactsPage,
})

function ContactsPage() {
  const params = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <WorkspaceShell
      header={<ContactsHeader />}
      mainClassName="flex flex-1 flex-col gap-4 sm:gap-6"
    >
      {(workspace) => (
        <ContactsListView
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
