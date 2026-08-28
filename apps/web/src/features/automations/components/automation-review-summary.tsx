import React from 'react'
import type { AutomationResponse } from '@engancha/contracts'
import {
  ExternalLink,
  Hash,
  Image,
  Link as LinkIcon,
  Mail,
  MessageSquare,
  Send,
  Tag,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getFinalAction,
  getPrivateReplyText,
  getPublicReplyText,
} from '../data/automation-action-mappers'
import type { AutomationStepId } from '../data/automation-readiness'
import { AutomationStatusBadge } from './automation-status-badge'

export interface AutomationReviewSummaryProps {
  automation: AutomationResponse
  onNavigateStep?: (stepId: AutomationStepId) => void
}

interface SummaryCardProps {
  stepId: AutomationStepId
  title: string
  icon: React.ComponentType<{ className?: string }>
  testId: string
  editTestId: string
  onEdit?: () => void
  children: React.ReactNode
}

function SummaryCard({
  title,
  icon: Icon,
  testId,
  editTestId,
  onEdit,
  children,
}: SummaryCardProps) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary shrink-0" />
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          data-testid={editTestId}
          onClick={onEdit}
        >
          Editar
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  )
}

export function AutomationReviewSummary({
  automation,
  onNavigateStep,
}: AutomationReviewSummaryProps) {
  const current = automation.current ?? automation.draft ?? null
  const actions = current?.actions ?? []

  const publicReplyText = getPublicReplyText(actions)
  const privateReplyText = getPrivateReplyText(actions)
  const finalAction = getFinalAction(actions)

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        Resumo consolidado da automação
      </h3>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 1. Identificação */}
        <SummaryCard
          stepId="identification"
          title="1. Identificação"
          icon={Tag}
          testId="automation-review-summary-identification"
          editTestId="automation-review-edit-identification"
          onEdit={() => onNavigateStep?.('identification')}
        >
          <div className="text-base font-semibold truncate">
            {current?.name || (
              <span className="text-muted-foreground italic">Nome não informado</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <AutomationStatusBadge status={automation.status} />
            <span className="text-xs text-muted-foreground">Revisão #{current?.version ?? 1}</span>
          </div>
        </SummaryCard>

        {/* 2. Conteúdo */}
        <SummaryCard
          stepId="content"
          title="2. Conteúdo associado"
          icon={Image}
          testId="automation-review-summary-content"
          editTestId="automation-review-edit-content"
          onEdit={() => onNavigateStep?.('content')}
        >
          {current?.target ? (
            <>
              <div className="font-semibold text-sm truncate">{current.target.title}</div>
              <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px]">
                  {current.target.provider}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {current.target.contentType}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {current.target.mode === 'SIMULATED' ? 'Simulado' : 'Real'}
                </Badge>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Nenhum conteúdo associado a esta automação.
            </p>
          )}
        </SummaryCard>

        {/* 3. Palavra-chave */}
        <SummaryCard
          stepId="keyword"
          title="3. Palavra-chave do gatilho"
          icon={Hash}
          testId="automation-review-summary-keyword"
          editTestId="automation-review-edit-keyword"
          onEdit={() => onNavigateStep?.('keyword')}
        >
          {current?.keyword ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Gatilho exato:</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {current.keyword}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Aciona quando o comentário no post contiver este termo.
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Nenhuma palavra-chave configurada.
            </p>
          )}
        </SummaryCard>

        {/* 4. Resposta pública */}
        <SummaryCard
          stepId="public-reply"
          title="4. Resposta pública"
          icon={MessageSquare}
          testId="automation-review-summary-public-reply"
          editTestId="automation-review-edit-public-reply"
          onEdit={() => onNavigateStep?.('public-reply')}
        >
          {publicReplyText ? (
            <div className="rounded bg-muted/50 p-2.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {publicReplyText}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Nenhuma resposta pública configurada.
            </p>
          )}
        </SummaryCard>

        {/* 5. Mensagem direta (DM) */}
        <SummaryCard
          stepId="direct-message"
          title="5. Mensagem direta (DM)"
          icon={Send}
          testId="automation-review-summary-direct-message"
          editTestId="automation-review-edit-direct-message"
          onEdit={() => onNavigateStep?.('direct-message')}
        >
          {privateReplyText ? (
            <div className="rounded bg-muted/50 p-2.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {privateReplyText}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Nenhuma mensagem direta configurada.
            </p>
          )}
        </SummaryCard>

        {/* 6. Ação final */}
        <SummaryCard
          stepId="final-action"
          title="6. Ação final"
          icon={finalAction?.type === 'CAPTURE_EMAIL' ? Mail : LinkIcon}
          testId="automation-review-summary-final-action"
          editTestId="automation-review-edit-final-action"
          onEdit={() => onNavigateStep?.('final-action')}
        >
          {finalAction ? (
            finalAction.type === 'LINK' ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    Link externo
                  </Badge>
                  <span className="text-xs font-semibold">{finalAction.label || 'Abrir link'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground break-all">
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span>{finalAction.url}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    Captura de e-mail
                  </Badge>
                </div>
                <div className="rounded bg-muted/50 p-2 text-xs text-foreground whitespace-pre-wrap">
                  {finalAction.prompt}
                </div>
              </div>
            )
          ) : (
            <p className="text-xs text-muted-foreground italic">Nenhuma ação final configurada.</p>
          )}
        </SummaryCard>
      </div>
    </div>
  )
}
