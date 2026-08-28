import { Loader2, Pause, Sparkles } from 'lucide-react'
import type { AutomationStatus } from '@engancha/contracts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface AutomationReviewPublishBarProps {
  status: AutomationStatus
  isReady: boolean
  isPublishing?: boolean
  hasUnpublishedChanges?: boolean
  isPausing?: boolean
  onPublish?: () => Promise<void>
  onPause?: () => void
}

export function AutomationReviewPublishBar({
  status,
  isReady,
  isPublishing = false,
  hasUnpublishedChanges = false,
  isPausing = false,
  onPublish,
  onPause,
}: AutomationReviewPublishBarProps) {
  const isActive = status === 'ACTIVE'
  const isPaused = status === 'PAUSED'

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h4 className="font-semibold text-sm">
            {isActive
              ? hasUnpublishedChanges
                ? 'Automação ativa com alterações pendentes'
                : 'Automação ativa no workspace'
              : isPaused
                ? 'Automação pausada'
                : 'Pronto para ativar sua automação?'}
          </h4>
          <p className="text-xs text-muted-foreground">
            {isActive
              ? hasUnpublishedChanges
                ? 'A versão atualmente em execução continua respondendo no Instagram até que você publique as alterações.'
                : 'Esta automação está atualmente ativa respondendo aos comentários e mensagens.'
              : isPaused
                ? 'Esta automação está pausada e não está processando comentários. Publique novamente para reativar.'
                : isReady
                  ? 'Ao publicar, a automação começará a responder interações para este conteúdo imediatamente.'
                  : 'Complete as pendências indicadas no checklist acima para habilitar a publicação.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isActive && onPause && (
            <Button
              variant="outline"
              size="lg"
              disabled={isPausing || isPublishing}
              data-testid="automation-pause-button"
              className="shrink-0 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
              onClick={onPause}
            >
              {isPausing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Pausando...
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pausar automação
                </>
              )}
            </Button>
          )}

          <Button
            size="lg"
            disabled={!isReady || isPublishing || isPausing}
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
                {isActive && hasUnpublishedChanges
                  ? 'Publicar alterações'
                  : isActive
                    ? 'Republicar automação'
                    : isPaused
                      ? 'Reativar automação'
                      : 'Publicar automação'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
