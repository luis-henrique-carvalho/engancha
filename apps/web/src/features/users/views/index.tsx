import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '#/components/config-drawer'
import { Header } from '#/components/layout/header'
import { Main } from '#/components/layout/main'
import { ProfileDropdown } from '#/components/profile-dropdown'
import { Search } from '#/components/search'
import { ThemeSwitch } from '#/components/theme-switch'
import { UsersDialogs } from '../components/users-dialogs'
import { UsersPrimaryButtons } from '../components/users-primary-buttons'
import { UsersProvider } from '../components/users-provider'
import { UsersTable } from '../components/users-table'
import { useUsersList } from '../hooks/use-users'
import { userUiSchema } from '../data/schema'

const route = getRouteApi('/_authenticated/users/')

export function UsersView() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const params = {
    page: search.page ?? 1,
    limit: search.limit ?? 20,
    query: search.query?.trim() || undefined,
    emailVerified: search.emailVerified,
  }
  const { data, isLoading } = useUsersList(params)
  const users = userUiSchema.array().parse(data?.items ?? [])

  return (
    <UsersProvider>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User List</h2>
            <p className="text-muted-foreground">
              Manage your users and their roles here.
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <UsersTable
          data={users}
          total={data?.meta.total ?? 0}
          search={search}
          navigate={navigate as any}
          isLoading={isLoading}
        />
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
