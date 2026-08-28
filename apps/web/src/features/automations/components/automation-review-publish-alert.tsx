import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { AutomationStepId } from '../data/automation-readiness'

export interface AutomationReviewPublishAlertProps {
  errorMessage: string | null
  issues: string[] | null
  onNavigateStep?: (stepId: AutomationStepId) => void
}

const ISSUE_STEP_MAP: Record<string, { label: string; stepId: AutomationStepId }> = {
  name: { label: 'Identificação', stepId: 'identification' },
  targetId: { label: 'Conteúdo', stepId: 'content' },
  keyword: { label: 'Palavra-chave', stepId: 'keyword' },
  actions: { label: 'Ações da resposta', stepId: 'final-action' },
}

export function AutomationReviewPublishAlert({
  errorMessage,
  issues,
  onNavigateStep,
}: AutomationReviewPublishAlertProps) {
  if (!errorMessage) return null

  return (
    <Alert variant="destructive" data-testid="automation-publish-error-alert">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Não foi possível publicar a automação</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{errorMessage}</p>
        {issues && issues.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider">Etapas com pendências:</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {issues.map((issue) => {
                const info = ISSUE_STEP_MAP[issue] ?? { label: issue, stepId: 'identification' }
                return (
                  <Button
                    key={issue}
                    variant="outline"
                    size="sm"
                    className="h-7 border-destructive/40 text-xs bg-destructive/10 hover:bg-destructive/20"
                    onClick={() => onNavigateStep?.(info.stepId)}
                  >
                    {info.label}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
