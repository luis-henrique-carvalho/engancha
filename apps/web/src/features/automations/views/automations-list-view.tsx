import type { AutomationListRequest } from '@engancha/contracts'
import { AutomationTable } from '../components/automation-table'
import { AutomationsPrimaryButtons } from '../components/automations-primary-buttons'
import { useAutomationsList } from '../hooks/use-automations-list'

export interface AutomationsListViewProps {
  workspaceId: string
  params: AutomationListRequest
  onParamsChange: (params: AutomationListRequest) => void
  onCreateClick?: () => void
  isCreating?: boolean
}

export function AutomationsListView({
  workspaceId,
  params,
  onParamsChange,
  onCreateClick,
  isCreating,
}: AutomationsListViewProps) {
  const automations = useAutomationsList(workspaceId, params)
  const items = automations.data?.items ?? []
  const meta = automations.data?.meta ?? {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    total: 0,
    totalPages: 0,
  }

  const filters = { query: params.query, status: params.status }

  return (
    <div className="space-y-4" data-testid="automations-list-view">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Automações</h2>
          <p className="text-muted-foreground">
            Gerencie respostas automáticas a comentários no Instagram.
          </p>
        </div>
        {onCreateClick && (
          <AutomationsPrimaryButtons onCreateClick={onCreateClick} isCreating={isCreating} />
        )}
      </div>

      <AutomationTable
        workspaceId={workspaceId}
        data={items}
        isLoading={automations.isLoading}
        meta={meta}
        filters={filters}
        onFiltersChange={(next) => onParamsChange({ ...params, ...next, page: 1 })}
        onPageChange={(page) => onParamsChange({ ...params, page })}
        onPageSizeChange={(limit) => onParamsChange({ ...params, limit, page: 1 })}
      />
    </div>
  )
}
