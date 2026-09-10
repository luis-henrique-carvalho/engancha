import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { extractSimulationOutputs } from '../../data/simulation-view-mappers'
import type { SseConnectionStatus } from '../../hooks/use-simulation-execution'

export interface SubmitEmailCaptureParams {
  conversationId: string
  captureId: string
  email: string
  idempotencyKey?: string
  executionId: string
}

export interface SimulationFollowerChatProps {
  execution: SimulationExecutionResponse | null
  isLoading?: boolean
  isSubmitting?: boolean
  isRetrying?: boolean
  isSubmittingEmail?: boolean
  isReconnecting?: boolean
  connectionStatus?: SseConnectionStatus
  error?: Error | null
  emailCaptureError?: Error | null
  onSubmitEmail?: (params: SubmitEmailCaptureParams) => Promise<unknown> | void
  onRetry?: () => Promise<unknown> | void
  onReset?: () => void
}

export function SimulationFollowerChat({
  execution,
  isLoading = false,
  isSubmitting = false,
  isRetrying = false,
  isSubmittingEmail = false,
  isReconnecting = false,
  error = null,
  emailCaptureError = null,
  onSubmitEmail,
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
            isSubmittingEmail={isSubmittingEmail}
            emailCaptureError={emailCaptureError}
            onSubmitEmail={onSubmitEmail}
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
  isSubmittingEmail: boolean
  emailCaptureError: Error | null
  onSubmitEmail?: (params: SubmitEmailCaptureParams) => Promise<unknown> | void
  onRetry?: () => Promise<unknown> | void
}

function SimulationFollowerJourney({
  execution,
  outputs,
  isRetrying,
  isSubmittingEmail,
  emailCaptureError,
  onSubmitEmail,
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

      <SimulationFollowerOutputs
        execution={execution}
        outputs={outputs}
        isSubmittingEmail={isSubmittingEmail}
        emailCaptureError={emailCaptureError}
        onSubmitEmail={onSubmitEmail}
      />

      {(execution.status === 'PENDING' || execution.status === 'PROCESSING') && (
        <div
          className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground bg-muted/20"
          data-testid="simulation-processing-step"
        >
          <RefreshCw className="size-3.5 animate-spin text-primary" />
          <span>Analisando comentário e preparando respostas...</span>
        </div>
      )}

      {execution.status === 'COMPLETED' && !outputs.emailCapture && (
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

interface SimulationFollowerOutputsProps {
  execution: SimulationExecutionResponse
  outputs: ReturnType<typeof extractSimulationOutputs>
  isSubmittingEmail: boolean
  emailCaptureError: Error | null
  onSubmitEmail?: (params: {
    conversationId: string
    captureId: string
    email: string
    idempotencyKey?: string
    executionId: string
  }) => Promise<unknown> | void
}

function SimulationFollowerOutputs({
  execution,
  outputs,
  isSubmittingEmail,
  emailCaptureError,
  onSubmitEmail,
}: SimulationFollowerOutputsProps) {
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
        <SimulationFollowerEmailCaptureSection
          execution={execution}
          prompt={outputs.emailCapture.prompt}
          isSubmittingEmail={isSubmittingEmail}
          emailCaptureError={emailCaptureError}
          onSubmitEmail={onSubmitEmail}
        />
      )}
    </>
  )
}

interface SimulationFollowerEmailCaptureSectionProps {
  execution: SimulationExecutionResponse
  prompt: string
  isSubmittingEmail: boolean
  emailCaptureError: Error | null
  onSubmitEmail?: (params: SubmitEmailCaptureParams) => Promise<unknown> | void
}

function EmailCaptureAlerts({
  emailCapture,
  emailCaptureError,
  isIdentityConflict,
  isSuperseded,
  isSubmittingEmail,
  onRetry,
}: {
  emailCapture: any
  emailCaptureError: Error | null
  isIdentityConflict: boolean
  isSuperseded: boolean
  isSubmittingEmail: boolean
  onRetry: () => void
}) {
  return (
    <>
      {isIdentityConflict && (
        <Alert
          variant="destructive"
          className="space-y-1.5"
          data-testid="simulation-email-conflict-alert"
        >
          <AlertCircle className="size-4" />
          <AlertTitle className="text-xs font-semibold">Conflito de identidade</AlertTitle>
          <AlertDescription className="text-xs">
            {emailCapture?.errorMessage ||
              'O e-mail informado já está associado a outro contato neste espaço de trabalho. Por favor, informe outro endereço.'}
          </AlertDescription>
        </Alert>
      )}

      {isSuperseded && (
        <Alert
          className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
          data-testid="simulation-email-superseded-alert"
        >
          <Info className="size-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-xs font-semibold">Solicitação substituída</AlertTitle>
          <AlertDescription className="text-xs">
            Esta solicitação de e-mail foi substituída por uma nova interação nesta conversa.
          </AlertDescription>
        </Alert>
      )}

      {emailCaptureError && !isIdentityConflict && (
        <Alert
          variant="destructive"
          className="space-y-2"
          data-testid="simulation-email-error-alert"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4" />
            <AlertTitle className="text-xs font-semibold">Falha ao enviar resposta</AlertTitle>
          </div>
          <AlertDescription className="text-xs">{emailCaptureError.message}</AlertDescription>
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isSubmittingEmail}
            className="h-7 gap-1.5 text-xs border-destructive/30 hover:bg-destructive/10"
            data-testid="simulation-email-retry-btn"
          >
            <RefreshCw className={isSubmittingEmail ? 'size-3 animate-spin' : 'size-3'} />
            Tentar enviar novamente
          </Button>
        </Alert>
      )}
    </>
  )
}

function EmailCaptureForm({
  onSubmit,
  isProcessing,
}: {
  onSubmit: (email: string) => Promise<void>
  isProcessing: boolean
}) {
  const [emailInput, setEmailInput] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    const trimmed = emailInput.trim()
    if (!trimmed) {
      setLocalError('Por favor, informe um endereço de e-mail.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      setLocalError('Por favor, informe um endereço de e-mail válido.')
      return
    }

    await onSubmit(trimmed)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 pt-1"
      data-testid="simulation-email-capture-form"
    >
      {localError && (
        <p
          className="text-[11px] text-destructive font-medium"
          data-testid="simulation-email-validation-error"
        >
          {localError}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Input
          type="email"
          placeholder="seu.email@exemplo.com"
          value={emailInput}
          onChange={(e) => {
            setEmailInput(e.target.value)
            if (localError) setLocalError(null)
          }}
          disabled={isProcessing}
          aria-label="Seu endereço de e-mail"
          className="text-xs h-8"
          data-testid="simulation-email-input"
        />
        <Button
          type="submit"
          size="sm"
          disabled={isProcessing || !emailInput.trim()}
          className="h-8 px-3 text-xs gap-1.5 shrink-0"
          data-testid="simulation-email-submit-btn"
        >
          {isProcessing ? (
            <RefreshCw className="size-3 animate-spin" />
          ) : (
            <Send className="size-3" />
          )}
          {isProcessing ? 'Enviando...' : 'Enviar'}
        </Button>
      </div>
    </form>
  )
}

function SimulationFollowerEmailCaptureSection({
  execution,
  prompt,
  isSubmittingEmail,
  emailCaptureError,
  onSubmitEmail,
}: SimulationFollowerEmailCaptureSectionProps) {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [idempotencyKey] = useState(() => crypto.randomUUID())

  const emailCapture = execution.emailCapture
  const status = emailCapture?.status ?? (execution.status === 'COMPLETED' ? 'PENDING' : null)
  const isCompleted = status === 'COMPLETED'
  const isProcessing = status === 'PROCESSING' || isSubmittingEmail
  const isSuperseded = status === 'SUPERSEDED'
  const isIdentityConflict = emailCapture?.errorCode === 'IDENTITY_CONFLICT'

  const handleSubmit = async (email: string) => {
    if (!execution.conversationId || !emailCapture?.id || !onSubmitEmail) return
    setSubmittedEmail(email)
    try {
      await onSubmitEmail({
        conversationId: execution.conversationId,
        captureId: emailCapture.id,
        email,
        idempotencyKey,
        executionId: execution.id,
      })
    } catch {
      // Capturado via hook
    }
  }

  return (
    <div
      className="space-y-3"
      data-testid="simulation-step-email-capture"
    >
      <div className="rounded-lg border bg-amber-500/5 border-amber-500/20 p-3.5 space-y-2.5">
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
        <p className="text-xs text-foreground">{prompt}</p>
        <div
          className="rounded border border-dashed border-amber-500/40 bg-amber-500/5 p-2 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5"
          data-testid="simulation-email-notice"
        >
          <Info className="size-3.5 shrink-0" />
          <span>
            Simulação interativa: responda com um e-mail para testar a captura e a criação do lead.
          </span>
        </div>
      </div>

      {(submittedEmail || isCompleted) && (
        <div
          className="flex justify-end"
          data-testid="simulation-follower-email-response-bubble"
        >
          <div className="max-w-[85%] rounded-lg bg-primary text-primary-foreground p-3 space-y-1 text-xs">
            <div className="flex items-center justify-between gap-2 text-[10px] opacity-80">
              <span>{execution.input.author}</span>
              <span>Resposta de e-mail</span>
            </div>
            <p className="font-mono">{submittedEmail || 'E-mail enviado'}</p>
          </div>
        </div>
      )}

      {isProcessing && !isCompleted && (
        <div
          className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground bg-muted/20"
          data-testid="simulation-email-processing-step"
        >
          <RefreshCw className="size-3.5 animate-spin text-primary" />
          <span>Processando resposta de e-mail e registrando contato...</span>
        </div>
      )}

      <EmailCaptureAlerts
        emailCapture={emailCapture}
        emailCaptureError={emailCaptureError}
        isIdentityConflict={isIdentityConflict}
        isSuperseded={isSuperseded}
        isSubmittingEmail={isSubmittingEmail}
        onRetry={() => {
          if (submittedEmail) void handleSubmit(submittedEmail)
        }}
      />

      {isCompleted && (
        <div
          className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
          data-testid="simulation-email-completed-banner"
        >
          <CheckCircle2 className="size-4" />
          <span>E-mail capturado com sucesso! Lead registrado no workspace.</span>
        </div>
      )}

      {execution.status === 'COMPLETED' &&
        !isCompleted &&
        !isSuperseded &&
        execution.conversationId &&
        emailCapture?.id && (
          <EmailCaptureForm
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
          />
        )}
    </div>
  )
}
