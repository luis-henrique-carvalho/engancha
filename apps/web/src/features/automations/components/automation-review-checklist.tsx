import React from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Hash,
  Image,
  Link as LinkIcon,
  MessageSquare,
  Send,
  Sparkles,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AutomationReadinessResult, AutomationStepId } from '../data/automation-readiness'

export interface AutomationReviewChecklistProps {
  readiness: AutomationReadinessResult
  onNavigateStep?: (stepId: AutomationStepId) => void
}

const STEP_ICONS: Record<AutomationStepId, React.ComponentType<{ className?: string }>> = {
  identification: Tag,
  content: Image,
  keyword: Hash,
  'public-reply': MessageSquare,
  'direct-message': Send,
  'final-action': LinkIcon,
}

export function AutomationReviewChecklist({
  readiness,
  onNavigateStep,
}: AutomationReviewChecklistProps) {
  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              Checklist de prontidão para publicação
            </CardTitle>
            <CardDescription>
              Revise os requisitos antes de ativar a automação no seu workspace.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={readiness.isReady ? 'default' : 'secondary'}
              data-testid="automation-readiness-badge"
            >
              {readiness.completedCount} de {readiness.totalCount} etapas preenchidas
            </Badge>
            <span
              className={cn(
                'text-xs font-medium',
                readiness.isReady ? 'text-primary' : 'text-amber-600 dark:text-amber-400',
              )}
              data-testid="automation-readiness-status"
            >
              {readiness.isReady ? 'Pronta para publicação' : 'Pendências encontradas'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {readiness.items.map((item) => {
            const Icon = STEP_ICONS[item.id]
            return (
              <div
                key={item.id}
                className={cn(
                  'flex flex-col justify-between rounded-lg border p-3.5 transition-colors min-w-0',
                  item.isComplete
                    ? 'border-border/60 bg-card/60'
                    : 'border-amber-300/60 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20',
                )}
              >
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-medium',
                        item.isComplete
                          ? 'bg-primary/10 text-primary'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-xs font-semibold truncate"
                        title={item.title}
                      >
                        {item.title}
                      </div>
                      <div
                        className="text-[11px] font-medium"
                        data-testid={`readiness-item-status-${item.id}`}
                      >
                        {item.isComplete ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            Completo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 shrink-0 hover:bg-background/80"
                    data-testid={`automation-review-step-${item.id}-action`}
                    onClick={() => onNavigateStep?.(item.id)}
                  >
                    {item.isComplete ? 'Editar' : 'Configurar'}
                    <ArrowRight className="ml-1 h-3 w-3 shrink-0" />
                  </Button>
                </div>
                <div
                  className="mt-2.5 text-xs text-muted-foreground truncate"
                  title={item.valueSummary}
                >
                  {item.valueSummary}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
