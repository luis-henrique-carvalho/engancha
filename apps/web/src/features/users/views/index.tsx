import { RefreshCw } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { UsersDialogs } from '../components/users-dialogs'
import { UsersPrimaryButtons } from '../components/users-primary-buttons'
import { UsersProvider } from '../components/users-provider'
import { UsersTable } from '../components/users-table'
import { useUsersList } from '../hooks/use-users'
import { userUiSchema } from '../data/schema'

type UsersViewProps = { canManage: boolean; workspaceId: string }

export function UsersView({ canManage, workspaceId }: UsersViewProps) {
  const members = useUsersList(workspaceId, canManage)
  const users = userUiSchema.array().parse(members.data ?? [])

  if (!canManage) return null

  return (
    <UsersProvider workspaceId={workspaceId}>
      <section className="rounded-lg border bg-card">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="p-5">
            <h2 className="text-lg font-semibold">Pessoas</h2>
            <p className="text-sm text-muted-foreground">Membros e convites do workspace ativo.</p>
          </div>
          <div className="flex items-center gap-2 p-5">
            {members.isError ? (
              <Button variant="outline" size="sm" onClick={() => void members.refetch()}>
                <RefreshCw /> Tentar novamente
              </Button>
            ) : null}
            <UsersPrimaryButtons />
          </div>
        </div>
        {members.isError ? (
          <p className="border-t p-5 text-sm text-destructive">
            Não foi possível carregar as pessoas deste workspace.
          </p>
        ) : (
          <div className="border-t">
            <UsersTable data={users} isLoading={members.isLoading} />
          </div>
        )}
      </section>

      <UsersDialogs />
    </UsersProvider>
  )
}
