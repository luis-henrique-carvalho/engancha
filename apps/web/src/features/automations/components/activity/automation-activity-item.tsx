import { useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Bot,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HelpCircle,
  Instagram,
  Mail,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  User,
} from 'lucide-react'
import type { SimulationExecutionResponse } from '@engancha/contracts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { formatActivityTime, getAutomationMatchDescription } from '../../data/activity-grouping'
import {
  extractSimulationOutputs,
  getExecutionStatusViewModel,
} from '../../data/simulation-view-mappers'

export interface AutomationActivityItemProps {
  execution: SimulationExecutionResponse
  currentAutomationId?: string
  isRetrying?: boolean
  onRetry?: (executionId: string) => void
}

export function AutomationActivityItem({
  execution,
  currentAutomationId,
  isRetrying = false,
  onRetry,
}: AutomationActivityItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const statusVm = getExecutionStatusViewModel(execution.status, execution.matched, execution.error)
  const matchDesc = getAutomationMatchDescription(execution, currentAutomationId)
  const outputs = extractSimulationOutputs(execution.outputs)
  const timeFormatted = formatActivityTime(execution.createdAt || execution.input.submittedAt)
  const contentTitle = execution.content?.title || 'Publicação simulada'

  return (
    <Card
      className={cn(
        'overflow-hidden transition-colors border',
        execution.status === 'FAILED' && 'border-destructive/30 bg-destructive/5',
        execution.status === 'IGNORED' && 'border-muted-foreground/20 bg-muted/10',
      )}
      data-testid={`activity-item-${execution.id}`}
    >
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <div className="p-4">
          <AutomationActivityHeader
            execution={execution}
            statusVm={statusVm}
            matchDesc={matchDesc}
            contentTitle={contentTitle}
            timeFormatted={timeFormatted}
            isOpen={isOpen}
            isRetrying={isRetrying}
            onRetry={onRetry}
          />

          <div className="mt-3 rounded-md bg-muted/30 p-2.5 text-xs">
            <span className="text-muted-foreground font-medium mr-1.5">Comentário:</span>
            <span className="text-foreground italic">"{execution.input.text}"</span>
          </div>
        </div>

        <CollapsibleContent>
          <AutomationActivityTimeline
            execution={execution}
            matchDesc={matchDesc}
            outputs={outputs}
          />
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

interface AutomationActivityHeaderProps {
  execution: SimulationExecutionResponse
  statusVm: ReturnType<typeof getExecutionStatusViewModel>
  matchDesc: ReturnType<typeof getAutomationMatchDescription>
  contentTitle: string
  timeFormatted: string | null
  isOpen: boolean
  isRetrying: boolean
  onRetry?: (executionId: string) => void
}

function AutomationActivityHeader({
  execution,
  statusVm,
  matchDesc,
  contentTitle,
  timeFormatted,
  isOpen,
  isRetrying,
  onRetry,
}: AutomationActivityHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
            execution.status === 'COMPLETED' && 'bg-primary/10 text-primary',
            execution.status === 'PROCESSING' && 'bg-secondary text-secondary-foreground',
            execution.status === 'PENDING' && 'bg-muted text-muted-foreground',
            execution.status === 'IGNORED' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            execution.status === 'FAILED' && 'bg-destructive/10 text-destructive',
          )}
        >
          {execution.status === 'COMPLETED' && <Bot className="size-4" />}
          {execution.status === 'PROCESSING' && <RefreshCw className="size-4 animate-spin" />}
          {execution.status === 'PENDING' && <MessageCircle className="size-4" />}
          {execution.status === 'IGNORED' && <HelpCircle className="size-4" />}
          {execution.status === 'FAILED' && <AlertCircle className="size-4" />}
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold truncate">@{execution.input.author}</span>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 font-normal"
            >
              <Instagram className="mr-1 size-2.5" />
              Simulado
            </Badge>
            <Badge
              variant={statusVm.variant}
              className="text-[10px] px-1.5 py-0 font-medium"
              data-testid="activity-status-badge"
            >
              {statusVm.label}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate max-w-[200px]">{contentTitle}</span>
            <span>•</span>
            <span
              className={cn(
                'font-medium',
                matchDesc.type === 'unmatched' && 'text-amber-600 dark:text-amber-400',
                matchDesc.type === 'failed' && 'text-destructive',
              )}
              data-testid="activity-match-label"
            >
              {matchDesc.label}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        {timeFormatted && (
          <span className="text-xs text-muted-foreground mr-1">{timeFormatted}</span>
        )}

        {execution.status === 'FAILED' && onRetry && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            disabled={isRetrying}
            onClick={(e) => {
              e.stopPropagation()
              onRetry(execution.id)
            }}
            data-testid="activity-retry-button"
          >
            <RefreshCw className={cn('size-3.5', isRetrying && 'animate-spin')} />
            {isRetrying ? 'Reprocessando...' : 'Tentar novamente'}
          </Button>
        )}

        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            aria-label={isOpen ? 'Recolher detalhes da jornada' : 'Expandir jornada'}
            data-testid="activity-expand-button"
          >
            {isOpen ? (
              <>
                <span className="hidden sm:inline mr-1">Ocultar</span>
                <ChevronUp className="size-4" />
              </>
            ) : (
              <>
                <span className="hidden sm:inline mr-1">Ver jornada</span>
                <ChevronDown className="size-4" />
              </>
            )}
          </Button>
        </CollapsibleTrigger>
      </div>
    </div>
  )
}

interface AutomationActivityTimelineProps {
  execution: SimulationExecutionResponse
  matchDesc: ReturnType<typeof getAutomationMatchDescription>
  outputs: ReturnType<typeof extractSimulationOutputs>
}

function AutomationActivityTimeline({
  execution,
  matchDesc,
  outputs,
}: AutomationActivityTimelineProps) {
  return (
    <div
      className="border-t bg-muted/10 p-4 space-y-4 text-xs"
      data-testid="activity-journey-details"
    >
      <h5 className="font-semibold text-xs tracking-tight text-foreground flex items-center gap-1.5">
        <span>Jornada da interação</span>
        <Badge
          variant="outline"
          className="text-[10px] py-0 font-normal"
        >
          Passo a passo
        </Badge>
      </h5>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {/* Step 1: Ingested Comment */}
        <div className="relative">
          <div className="absolute -left-6 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="size-2.5" />
          </div>
          <div className="space-y-0.5">
            <p className="font-medium text-foreground">Comentário do seguidor</p>
            <p className="text-muted-foreground">
              @{execution.input.author} comentou: "{execution.input.text}"
            </p>
          </div>
        </div>

        {/* Step 2: Match / Evaluation */}
        <div className="relative">
          <div
            className={cn(
              'absolute -left-6 top-0.5 flex size-4 items-center justify-center rounded-full',
              matchDesc.type === 'matched' && 'bg-primary text-primary-foreground',
              matchDesc.type === 'other-matched' && 'bg-primary text-primary-foreground',
              matchDesc.type === 'unmatched' && 'bg-amber-500 text-white',
              matchDesc.type === 'failed' && 'bg-destructive text-white',
              (matchDesc.type === 'pending' || matchDesc.type === 'processing') &&
                'bg-muted text-muted-foreground',
            )}
          >
            <Bot className="size-2.5" />
          </div>
          <div className="space-y-0.5">
            <p className="font-medium text-foreground">{matchDesc.label}</p>
            <p className="text-muted-foreground">{matchDesc.description}</p>
          </div>
        </div>

        {/* Step 3: Public Reply Output */}
        {outputs.publicReply && (
          <div className="relative">
            <div className="absolute -left-6 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <MessageSquare className="size-2.5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Resposta pública simulada</p>
              <div className="rounded-md border bg-background p-2.5 text-xs text-foreground">
                {outputs.publicReply.text}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Private Reply (DM) Output */}
        {outputs.privateReply && (
          <div className="relative">
            <div className="absolute -left-6 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <MessageCircle className="size-2.5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Mensagem direta simulada (DM)</p>
              <div className="rounded-md border bg-background p-2.5 text-xs text-foreground">
                {outputs.privateReply.text}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Link Delivery Output */}
        {outputs.linkDelivery && (
          <div className="relative">
            <div className="absolute -left-6 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <ExternalLink className="size-2.5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Ação final: Entrega de link</p>
              <div className="flex items-center gap-2 rounded-md border bg-background p-2.5 text-xs text-primary">
                <span className="font-medium">
                  {outputs.linkDelivery.buttonText || 'Acessar Link'}
                </span>
                <ArrowRight className="size-3" />
                <span className="text-muted-foreground truncate">{outputs.linkDelivery.url}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Email Capture Prompt Output */}
        {outputs.emailCapture && (
          <div className="relative">
            <div className="absolute -left-6 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Mail className="size-2.5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Ação final: Solicitação de e-mail</p>
              <div className="rounded-md border bg-background p-2.5 text-xs text-foreground">
                <p className="font-medium mb-1">{outputs.emailCapture.prompt}</p>
                <p className="text-[11px] text-muted-foreground italic">
                  Nota: A captura efetiva do endereço será realizada nas próximas fases.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Error info if Failed */}
        {execution.status === 'FAILED' && execution.error && (
          <div className="relative">
            <div className="absolute -left-6 top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <AlertCircle className="size-2.5" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-destructive">Motivo da falha</p>
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
                {execution.error.message}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
