import type { SimulationExecutionResponse } from '@engancha/contracts'
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Info,
  Instagram,
  Mail,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Send,
  User,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { extractSimulationOutputs } from '../../data/simulation-view-mappers'
import type { SseConnectionStatus } from '../../hooks/use-simulation-execution'

export interface SimulationFollowerChatProps {
  execution: SimulationExecutionResponse | null
  isLoading?: boolean
  isSubmitting?: boolean
  isRetrying?: boolean
  isReconnecting?: boolean
  connectionStatus?: SseConnectionStatus
  error?: Error | null
  onRetry?: () => Promise<unknown> | void
  onReset?: () => void
}

export function SimulationFollowerChat({
  execution,
  isLoading = false,
  isSubmitting = false,
  isRetrying = false,
  isReconnecting = false,
  error = null,
  onRetry,
  onReset,
}: SimulationFollowerChatProps) {
  const outputs = execution ? extractSimulationOutputs(execution.outputs) : {}

  return (
    <Card
      className="h-full flex flex-col"
      data-testid="simulation-follower-chat-card"
    >
      <SimulationFollowerChatHeader
        isReconnecting={isReconnecting}
        showReset={Boolean(execution && onReset)}
        onReset={onReset}
      />

      <CardContent
        className="flex-1 p-4 space-y-4 overflow-y-auto"
        aria-live="polite"
        role="status"
        data-testid="simulation-follower-journey-content"
      >
        {!execution && !isSubmitting && !isLoading && <SimulationFollowerEmptyState />}

        {(isSubmitting || (isLoading && !execution)) && <SimulationFollowerSubmittingState />}

        {error && (
          <Alert
            variant="destructive"
            className="py-2.5 text-xs"
            data-testid="simulation-error-banner"
          >
            <AlertCircle className="size-4" />
            <AlertTitle>Erro na simulação</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {execution && (
          <SimulationFollowerJourney
            execution={execution}
            outputs={outputs}
            isRetrying={isRetrying}
            onRetry={onRetry}
          />
        )}
      </CardContent>
    </Card>
  )
}

function SimulationFollowerChatHeader({
  isReconnecting,
  showReset,
  onReset,
}: {
  isReconnecting: boolean
  showReset: boolean
  onReset?: () => void
}) {
  return (
    <CardHeader className="pb-3 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">Experiência do seguidor</CardTitle>
          <Badge
            variant="secondary"
            className="text-[10px]"
          >
            Simulado
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {isReconnecting && (
            <Badge
              variant="outline"
              className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px]"
              data-testid="simulation-reconnecting-badge"
            >
              <RefreshCw className="size-3 animate-spin" />
              Reconectando...
            </Badge>
          )}
          {showReset && onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              data-testid="simulation-reset-btn"
            >
              <RotateCcw className="mr-1 size-3" />
              Novo teste
            </Button>
          )}
        </div>
      </div>
    </CardHeader>
  )
}

function SimulationFollowerEmptyState() {
  return (
    <div
      className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center"
      data-testid="simulation-empty-state"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Instagram className="size-6" />
      </div>
      <h4 className="mt-3 text-sm font-semibold">Nenhum teste em execução</h4>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Envie um comentário pelo formulário ao lado para acompanhar a resposta pública, a mensagem
        direta e a ação final.
      </p>
    </div>
  )
}

function SimulationFollowerSubmittingState() {
  return (
    <div
      className="flex min-h-[250px] flex-col items-center justify-center gap-3 text-center"
      data-testid="simulation-submitting-state"
    >
      <RefreshCw className="size-6 animate-spin text-primary" />
      <div className="space-y-1">
        <p className="text-xs font-semibold">Enviando comentário de teste...</p>
        <p className="text-[11px] text-muted-foreground">
          Iniciando simulação da experiência do seguidor.
        </p>
      </div>
    </div>
  )
}

interface SimulationFollowerJourneyProps {
  execution: SimulationExecutionResponse
  outputs: ReturnType<typeof extractSimulationOutputs>
  isRetrying: boolean
  onRetry?: () => Promise<unknown> | void
}

function SimulationFollowerJourney({
  execution,
  outputs,
  isRetrying,
  onRetry,
}: SimulationFollowerJourneyProps) {
  return (
    <div className="space-y-4">
      {/* Step 1: Follower Comment */}
      <div
        className="rounded-lg border bg-card p-3.5 space-y-2 shadow-xs"
        data-testid="simulation-step-comment"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-3.5" />
            </div>
            <span className="text-xs font-semibold text-foreground">{execution.input.author}</span>
          </div>
          <Badge
            variant="outline"
            className="text-[10px]"
          >
            Comentário publicado
          </Badge>
        </div>
        <p className="text-xs text-foreground bg-muted/30 rounded p-2.5">
          "{execution.input.text}"
        </p>
      </div>

      {execution.status === 'IGNORED' && (
        <Alert
          className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
          data-testid="simulation-ignored-alert"
        >
          <Info className="size-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-xs font-semibold">Comentário ignorado</AlertTitle>
          <AlertDescription className="text-xs">
            Nenhuma automação ativa reconheceu a palavra-chave configurada para esta publicação.
          </AlertDescription>
        </Alert>
      )}

      {execution.status === 'FAILED' && (
        <Alert
          variant="destructive"
          className="space-y-2"
          data-testid="simulation-failed-alert"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4" />
            <AlertTitle className="text-xs font-semibold">Falha na simulação</AlertTitle>
          </div>
          <AlertDescription className="text-xs">
            {execution.error?.message ||
              'A simulação não pôde ser concluída devido a uma inconsistência.'}
          </AlertDescription>
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void onRetry()
              }}
              disabled={isRetrying}
              className="mt-2 h-7 gap-1.5 text-xs border-destructive/30 hover:bg-destructive/10"
              data-testid="simulation-retry-btn"
            >
              <RefreshCw className={isRetrying ? 'size-3 animate-spin' : 'size-3'} />
              {isRetrying ? 'Reprocessando...' : 'Tentar novamente'}
            </Button>
          )}
        </Alert>
      )}

      <SimulationFollowerOutputs outputs={outputs} />

      {(execution.status === 'PENDING' || execution.status === 'PROCESSING') && (
        <div
          className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground bg-muted/20"
          data-testid="simulation-processing-step"
        >
          <RefreshCw className="size-3.5 animate-spin text-primary" />
          <span>Analisando comentário e preparando respostas...</span>
        </div>
      )}

      {execution.status === 'COMPLETED' && (
        <div
          className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          data-testid="simulation-completed-banner"
        >
          <CheckCircle2 className="size-4" />
          <span>Simulação da jornada concluída com sucesso</span>
        </div>
      )}
    </div>
  )
}

function SimulationFollowerOutputs({
  outputs,
}: {
  outputs: ReturnType<typeof extractSimulationOutputs>
}) {
  return (
    <>
      {outputs.publicReply && (
        <div
          className="rounded-lg border bg-blue-500/5 border-blue-500/20 p-3.5 space-y-2"
          data-testid="simulation-step-public-reply"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <MessageSquare className="size-3.5" />
              </div>
              <span className="text-xs font-semibold text-foreground">Sua Conta</span>
            </div>
            <Badge
              variant="secondary"
              className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300"
            >
              Resposta pública
            </Badge>
          </div>
          <p className="text-xs text-foreground">{outputs.publicReply.text}</p>
        </div>
      )}

      {outputs.privateReply && (
        <div
          className="rounded-lg border bg-purple-500/5 border-purple-500/20 p-3.5 space-y-2"
          data-testid="simulation-step-direct-message"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400">
                <Send className="size-3.5" />
              </div>
              <span className="text-xs font-semibold text-foreground">Mensagem direta (DM)</span>
            </div>
            <Badge
              variant="secondary"
              className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-300"
            >
              Direct
            </Badge>
          </div>
          <p className="text-xs text-foreground whitespace-pre-wrap">{outputs.privateReply.text}</p>
        </div>
      )}

      {outputs.linkDelivery && (
        <div
          className="rounded-lg border bg-emerald-500/5 border-emerald-500/20 p-3.5 space-y-2.5"
          data-testid="simulation-step-link-delivery"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <ExternalLink className="size-3.5" />
              </div>
              <span className="text-xs font-semibold text-foreground">Ação final: Link</span>
            </div>
            <Badge
              variant="secondary"
              className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            >
              Link de destino
            </Badge>
          </div>
          <div className="rounded border bg-background p-2.5 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-foreground truncate">
              {outputs.linkDelivery.buttonText || 'Abrir link de destino'}
            </span>
            <Badge
              variant="outline"
              className="text-[10px] text-muted-foreground shrink-0 font-mono"
            >
              {outputs.linkDelivery.url}
            </Badge>
          </div>
        </div>
      )}

      {outputs.emailCapture && (
        <div
          className="rounded-lg border bg-amber-500/5 border-amber-500/20 p-3.5 space-y-2.5"
          data-testid="simulation-step-email-capture"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Mail className="size-3.5" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                Ação final: Captura de e-mail
              </span>
            </div>
            <Badge
              variant="secondary"
              className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
              Solicitação de e-mail
            </Badge>
          </div>
          <p className="text-xs text-foreground">{outputs.emailCapture.prompt}</p>
          <div
            className="rounded border border-dashed border-amber-500/40 bg-amber-500/5 p-2 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5"
            data-testid="simulation-email-notice"
          >
            <Info className="size-3.5 shrink-0" />
            <span>Simulação: a jornada encerra na solicitação. Nenhum dado real foi coletado.</span>
          </div>
        </div>
      )}
    </>
  )
}
