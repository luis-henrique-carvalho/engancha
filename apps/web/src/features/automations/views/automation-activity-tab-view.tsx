import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Activity, AlertCircle, FilterX, Play, RefreshCw, WifiOff } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AutomationActivityList } from '../components/automation-activity-list'
import { AutomationActivityPagination } from '../components/automation-activity-pagination'
import { AutomationActivityToolbar } from '../components/automation-activity-toolbar'
import type { ActivityFilters } from '../data/activity-filter-options'
import { groupExecutionsByDate } from '../data/activity-grouping'
import { useSimulationExecutionsList } from '../hooks/use-simulation-executions-list'

export interface AutomationActivityTabViewProps {
  automationId: string
  query?: string
  filters?: ActivityFilters
  page?: number
  limit?: number
  onQueryChange?: (query?: string) => void
  onFiltersChange?: (filters: ActivityFilters) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (limit: number) => void
  onReset?: () => void
}

export function AutomationActivityTabView({
  automationId,
  query: externalQuery,
  filters: externalFilters,
  page: externalPage,
  limit: externalLimit,
  onQueryChange: externalOnQueryChange,
  onFiltersChange: externalOnFiltersChange,
  onPageChange: externalOnPageChange,
  onPageSizeChange: externalOnPageSizeChange,
  onReset: externalOnReset,
}: AutomationActivityTabViewProps) {
  const [internalQuery, setInternalQuery] = useState<string | undefined>(undefined)
  const [internalFilters, setInternalFilters] = useState<ActivityFilters>({})
  const [internalPage, setInternalPage] = useState<number>(1)
  const [internalLimit, setInternalLimit] = useState<number>(20)

  const query = externalQuery !== undefined ? externalQuery : internalQuery
  const filters = externalFilters !== undefined ? externalFilters : internalFilters
  const page = externalPage !== undefined ? externalPage : internalPage
  const limit = externalLimit !== undefined ? externalLimit : internalLimit

  const handleQueryChange = (nextQuery?: string) => {
    if (externalOnQueryChange) externalOnQueryChange(nextQuery)
    else {
      setInternalQuery(nextQuery)
      setInternalPage(1)
    }
  }

  const handleFiltersChange = (nextFilters: ActivityFilters) => {
    if (externalOnFiltersChange) externalOnFiltersChange(nextFilters)
    else {
      setInternalFilters(nextFilters)
      setInternalPage(1)
    }
  }

  const handlePageChange = (nextPage: number) => {
    if (externalOnPageChange) externalOnPageChange(nextPage)
    else setInternalPage(nextPage)
  }

  const handlePageSizeChange = (nextLimit: number) => {
    if (externalOnPageSizeChange) externalOnPageSizeChange(nextLimit)
    else {
      setInternalLimit(nextLimit)
      setInternalPage(1)
    }
  }

  const handleReset = () => {
    if (externalOnReset) externalOnReset()
    else {
      setInternalQuery(undefined)
      setInternalFilters({})
      setInternalPage(1)
    }
  }

  const {
    executions,
    meta,
    isLoading,
    isLoadingMore,
    isRefreshing,
    isReconnecting,
    error,
    hasMore,
    retryingId,
    loadMore,
    refresh,
    retry,
  } = useSimulationExecutionsList({
    automationId,
    query,
    filters,
    page,
    limit,
  })

  const groups = groupExecutionsByDate(executions)
  const isFiltered = Boolean(
    query ||
      filters.status?.length ||
      filters.provider?.length ||
      filters.mode?.length ||
      filters.contentType?.length ||
      filters.outputType?.length,
  )

  if (isLoading) {
    return <AutomationActivityLoadingSkeleton />
  }

  return (
    <div
      className="space-y-6"
      data-testid="automation-activity-tab-view"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            Histórico de atividades
          </h3>
          <p className="text-xs text-muted-foreground">
            Interações e respostas simuladas vinculadas a esta automação e publicação.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isRefreshing}
          className="h-8 gap-1.5 text-xs"
          data-testid="activity-refresh-button"
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      <AutomationActivityToolbar
        query={query}
        onQueryChange={handleQueryChange}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleReset}
      />

      {isReconnecting && (
        <Alert
          className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
          data-testid="activity-reconnecting-banner"
        >
          <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-xs font-semibold">Reconectando em tempo real</AlertTitle>
          <AlertDescription className="text-xs">
            Atualizações em tempo real temporariamente suspensas. O histórico autoritativo continua
            preservado.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert
          variant="destructive"
          data-testid="activity-error-alert"
        >
          <AlertCircle className="size-4" />
          <AlertTitle className="text-xs font-semibold">Falha na consulta de atividades</AlertTitle>
          <AlertDescription className="text-xs flex items-center justify-between">
            <span>{error.message}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={refresh}
              className="h-7 text-xs border-destructive/30 hover:bg-destructive/10"
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {executions.length === 0 ? (
        isFiltered ? (
          <AutomationActivityFilteredEmpty onReset={handleReset} />
        ) : (
          <AutomationActivityEmpty automationId={automationId} />
        )
      ) : (
        <div className="space-y-6">
          <AutomationActivityList
            groups={groups}
            currentAutomationId={automationId}
            retryingId={retryingId}
            onRetry={retry}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
          />

          <AutomationActivityPagination
            page={meta.page}
            limit={meta.limit}
            total={meta.total}
            totalPages={meta.totalPages}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  )
}

function AutomationActivityLoadingSkeleton() {
  return (
    <div
      className="space-y-4"
      data-testid="automation-activity-loading"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-8 w-full max-w-md" />
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    </div>
  )
}

function AutomationActivityFilteredEmpty({ onReset }: { onReset: () => void }) {
  return (
    <Card
      className="border-dashed bg-muted/10 text-center py-8"
      data-testid="automation-activity-filtered-empty"
    >
      <CardHeader className="space-y-2">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FilterX className="size-6" />
        </div>
        <CardTitle className="text-base font-semibold">Nenhuma atividade encontrada</CardTitle>
        <CardDescription className="text-xs max-w-sm mx-auto">
          Nenhuma interação corresponde aos critérios e filtros selecionados no momento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          className="gap-1.5 text-xs font-semibold"
          data-testid="activity-empty-reset-button"
        >
          Limpar filtros
        </Button>
      </CardContent>
    </Card>
  )
}

function AutomationActivityEmpty({ automationId }: { automationId: string }) {
  return (
    <Card
      className="border-dashed bg-muted/10 text-center py-8"
      data-testid="automation-activity-empty"
    >
      <CardHeader className="space-y-2">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Activity className="size-6" />
        </div>
        <CardTitle className="text-base font-semibold">Nenhuma atividade registrada</CardTitle>
        <CardDescription className="text-xs max-w-sm mx-auto">
          As interações simuladas com a publicação aparecerão aqui em ordem cronológica após o
          primeiro teste.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          asChild
          size="sm"
          className="gap-1.5 text-xs font-semibold"
        >
          <Link to={`/automations/${automationId}/test` as any}>
            <Play className="size-3.5" />
            Fazer um teste agora
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
