import { ConfigDrawer } from '#/components/config-drawer'
import { Header } from '#/components/layout/header'
import { ProfileDropdown } from '#/components/profile-dropdown'
import { Search } from '#/components/search'
import { ThemeSwitch } from '#/components/theme-switch'
import { UsersDialogs } from '../components/users-dialogs'
import { UsersPrimaryButtons } from '../components/users-primary-buttons'
import { UsersProvider } from '../components/users-provider'
import { UsersTable } from '../components/users-table'
import { useUsersList } from '../hooks/use-users'
import { userUiSchema } from '../data/schema'
import type { WorkspaceMembersListRequest } from '@engancha/contracts'

type UsersViewProps = {
  canManage: boolean
  workspaceId: string
  params: WorkspaceMembersListRequest
  onParamsChange: (params: WorkspaceMembersListRequest) => void
}

export function UsersHeader() {
  return (
    <Header fixed>
      <Search className="me-auto" />
      <ThemeSwitch />
      <ConfigDrawer />
      <ProfileDropdown />
    </Header>
  )
}

export function UsersView({ canManage, workspaceId, params, onParamsChange }: UsersViewProps) {
  const members = useUsersList(workspaceId, params, canManage)
  const users = userUiSchema.array().parse(members.data?.items ?? [])

  if (!canManage) return null

  return (
    <UsersProvider workspaceId={workspaceId}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lista de pessoas</h2>
          <p className="text-muted-foreground">
            Gerencie os membros e convites do workspace ativo.
          </p>
        </div>
        <UsersPrimaryButtons />
      </div>

      <UsersTable
        data={users}
        isLoading={members.isLoading}
        meta={
          members.data?.meta ?? {
            page: params.page,
            limit: params.limit,
            total: 0,
            totalPages: 0,
          }
        }
        filters={params}
        onFiltersChange={(filters) => onParamsChange({ ...params, ...filters, page: 1 })}
        onPageChange={(page) => onParamsChange({ ...params, page })}
        onPageSizeChange={(limit) => onParamsChange({ ...params, limit, page: 1 })}
      />

      <UsersDialogs />
    </UsersProvider>
  )
}
