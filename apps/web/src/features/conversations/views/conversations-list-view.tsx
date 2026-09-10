import { Header } from '@/components/layout/header'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import type { ConversationListQuery } from '@engancha/contracts'
import { useConversationsList } from '../hooks/use-conversations-list'
import { ConversationsTable } from '../components/conversations-table'

export function ConversationsHeader() {
  return (
    <Header fixed>
      <Search className="me-auto" />
      <ThemeSwitch />
      <ConfigDrawer />
      <ProfileDropdown />
    </Header>
  )
}

type Props = {
  workspaceId: string
  params: Partial<ConversationListQuery>
  onParamsChange: (params: Partial<ConversationListQuery>) => void
}

export function ConversationsListView({ params, onParamsChange }: Props) {
  const { data, isLoading, isError, error, refetch } = useConversationsList(params)

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Conversas</h2>
          <p className="text-muted-foreground">
            Acompanhe o histórico de interações e capturas de cada contato.
          </p>
        </div>
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between">
          <span>Falha ao carregar conversas: {(error as Error)?.message || 'Erro inesperado'}</span>
          <button
            onClick={() => void refetch()}
            className="underline font-medium hover:opacity-80"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <ConversationsTable
        data={data?.items ?? []}
        isLoading={isLoading}
        meta={
          data?.meta ?? {
            page: params.page ?? 1,
            limit: params.limit ?? 20,
            total: 0,
            totalPages: 0,
          }
        }
        params={params}
        onParamsChange={(next) => onParamsChange({ ...next, page: 1 })}
        onPageChange={(page) => onParamsChange({ ...params, page })}
        onPageSizeChange={(limit) => onParamsChange({ ...params, limit, page: 1 })}
      />
    </div>
  )
}
