import { Loader2, Sparkles } from 'lucide-react'
import type { AutomationStatus } from '@engancha/contracts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface AutomationReviewPublishBarProps {
  status: AutomationStatus
  isReady: boolean
  isPublishing?: boolean
  onPublish?: () => Promise<void>
}

export function AutomationReviewPublishBar({
  status,
  isReady,
  isPublishing = false,
  onPublish,
}: AutomationReviewPublishBarProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h4 className="font-semibold text-sm">
            {status === 'ACTIVE'
              ? 'Automação ativa no workspace'
              : 'Pronto para ativar sua automação?'}
          </h4>
          <p className="text-xs text-muted-foreground">
            {status === 'ACTIVE'
              ? 'Esta automação está atualmente ativa. Novas alterações só entrarão em vigor após republicação.'
              : isReady
                ? 'Ao publicar, a automação começará a responder interações para este conteúdo imediatamente.'
                : 'Complete as pendências indicadas no checklist acima para habilitar a publicação.'}
          </p>
        </div>

        <Button
          size="lg"
          disabled={!isReady || isPublishing}
          data-testid="automation-publish-button"
          className="shrink-0"
          onClick={onPublish}
        >
          {isPublishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Publicar automação
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
