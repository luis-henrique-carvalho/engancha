import type { AutomationStatus } from '@engancha/contracts'
import { Badge } from '@/components/ui/badge'
import { AUTOMATION_STATUS_MAP } from '../data/automation-status'

interface AutomationStatusBadgeProps {
  status: AutomationStatus
  hasUnpublishedChanges?: boolean
  className?: string
}

export function AutomationStatusBadge({
  status,
  hasUnpublishedChanges,
  className,
}: AutomationStatusBadgeProps) {
  const config = AUTOMATION_STATUS_MAP[status] ?? {
    label: status,
    variant: 'secondary' as const,
  }

  return (
    <div className="flex items-center gap-1.5">
      <Badge
        variant={config.variant}
        className={className}
        data-testid={`automation-status-${status.toLowerCase()}`}
      >
        {config.label}
      </Badge>
      {status === 'ACTIVE' && hasUnpublishedChanges && (
        <Badge
          variant="outline"
          className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs"
          data-testid="automation-status-unpublished-badge"
        >
          Alterações pendentes
        </Badge>
      )}
    </div>
  )
}
