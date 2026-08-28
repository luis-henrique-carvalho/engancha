import { Link } from '@tanstack/react-router'
import { Activity, AlertCircle, Play, RefreshCw, WifiOff } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AutomationActivityList } from '../components/automation-activity-list'
import { groupExecutionsByDate } from '../data/activity-grouping'
import { useSimulationExecutionsList } from '../hooks/use-simulation-executions-list'

export interface AutomationActivityTabViewProps {
  automationId: string
}

export function AutomationActivityTabView({ automationId }: AutomationActivityTabViewProps) {
  const {
    executions,
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
  } = useSimulationExecutionsList({ automationId })

  const groups = groupExecutionsByDate(executions)

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="automation-activity-loading">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="automation-activity-tab-view">
      {/* Tab Header with refresh action */}
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

      {/* Reconnecting banner if SSE was interrupted */}
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

      {/* Error alert if fetch failed */}
      {error && (
        <Alert variant="destructive" data-testid="activity-error-alert">
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

      {/* Empty State */}
      {executions.length === 0 ? (
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
            <Button asChild size="sm" className="gap-1.5 text-xs font-semibold">
              <Link to={`/automations/${automationId}/test` as any}>
                <Play className="size-3.5" />
                Fazer um teste agora
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Activity Groups List */
        <AutomationActivityList
          groups={groups}
          currentAutomationId={automationId}
          retryingId={retryingId}
          onRetry={retry}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMore}
        />
      )}
    </div>
  )
}
