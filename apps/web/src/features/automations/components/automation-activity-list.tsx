import { Calendar, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ActivityGroup } from '../data/activity-grouping'
import { AutomationActivityItem } from './automation-activity-item'

export interface AutomationActivityListProps {
  groups: ActivityGroup[]
  currentAutomationId?: string
  retryingId?: string | null
  onRetry?: (executionId: string) => void
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}

export function AutomationActivityList({
  groups,
  currentAutomationId,
  retryingId,
  onRetry,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: AutomationActivityListProps) {
  return (
    <div
      className="space-y-6"
      data-testid="automation-activity-list"
    >
      {groups.map((group) => (
        <div
          key={group.dateLabel}
          className="space-y-3"
        >
          {/* Date header */}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Calendar className="size-3.5" />
            <span>{group.dateLabel}</span>
            <span className="text-[10px] font-normal lowercase">
              ({group.executions.length}{' '}
              {group.executions.length === 1 ? 'interação' : 'interações'})
            </span>
          </div>

          {/* List of items in date bucket */}
          <div className="space-y-3">
            {group.executions.map((execution) => (
              <AutomationActivityItem
                key={execution.id}
                execution={execution}
                currentAutomationId={currentAutomationId}
                isRetrying={retryingId === execution.id}
                onRetry={onRetry}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Pagination Load More */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-2 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="gap-2 text-xs font-medium"
            data-testid="activity-load-more-button"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Carregando interações anteriores...
              </>
            ) : (
              <>
                <ChevronDown className="size-3.5" />
                Carregar interações anteriores
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
