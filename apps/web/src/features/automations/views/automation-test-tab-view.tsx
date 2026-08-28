import { Link } from '@tanstack/react-router'
import { AlertCircle, CheckCircle2, FileEdit, PauseCircle, Play } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAutomationEditor } from '../components/automation-editor-provider'
import { SimulationFollowerChat } from '../components/simulation-follower-chat'
import { SimulationTestForm, type SimulationContentInfo } from '../components/simulation-test-form'
import { useSimulationExecution } from '../hooks/use-simulation-execution'

export interface AutomationTestTabViewProps {
  automationId: string
}

export function AutomationTestTabView({ automationId }: AutomationTestTabViewProps) {
  const { automation } = useAutomationEditor()

  const {
    execution,
    isLoading,
    isSubmitting,
    isRetrying,
    isReconnecting,
    connectionStatus,
    error,
    submitComment,
    retry,
    reset,
  } = useSimulationExecution()

  // Draft Automation Guidance
  if (automation.status === 'DRAFT') {
    return (
      <Card className="border-dashed bg-muted/20" data-testid="automation-test-draft-guidance">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileEdit className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">Automação em rascunho</CardTitle>
              <CardDescription className="text-xs">
                Esta automação ainda não foi publicada.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-muted-foreground">
          <p>
            Para testar a jornada do seguidor, conclua a configuração das etapas e publique uma
            versão ativa.
          </p>
          <Button asChild size="sm" className="gap-1.5 text-xs font-semibold">
            <Link to={`/automations/${automationId}/review` as any}>
              <CheckCircle2 className="size-3.5" />
              Ir para Revisão e Publicação
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Paused Automation Guidance
  if (automation.status === 'PAUSED') {
    return (
      <Card className="border-dashed bg-muted/20" data-testid="automation-test-paused-guidance">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <PauseCircle className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">Automação pausada</CardTitle>
              <CardDescription className="text-xs">
                As respostas automáticas estão desativadas no Instagram.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-muted-foreground">
          <p>
            Para simular comentários e testar o fluxo de respostas, reative a automação na aba de
            configuração.
          </p>
          <Button asChild size="sm" className="gap-1.5 text-xs font-semibold">
            <Link to={`/automations/${automationId}/review` as any}>
              <Play className="size-3.5" />
              Ir para Configuração
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const publishedRevision = automation.published
  const targetContent = publishedRevision?.target

  if (!publishedRevision || !targetContent) {
    return (
      <Alert variant="destructive" data-testid="automation-test-no-target-alert">
        <AlertCircle className="size-4" />
        <AlertTitle>Nenhum conteúdo vinculado</AlertTitle>
        <AlertDescription className="text-xs">
          A versão publicada não possui uma publicação vinculada para simulação. Configure a etapa
          de conteúdo e publique uma nova versão.
        </AlertDescription>
      </Alert>
    )
  }

  const contentInfo: SimulationContentInfo = {
    id: targetContent.id,
    externalId: targetContent.externalContentId,
    title: targetContent.title,
    type: targetContent.contentType,
  }

  const handleFormSubmit = async (values: { author: string; text: string; commentId?: string }) => {
    await submitComment({
      contentId: targetContent.id,
      provider: 'INSTAGRAM',
      author: values.author,
      text: values.text,
      commentId: values.commentId,
    })
  }

  return (
    <div
      className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start"
      data-testid="automation-test-tab-view"
    >
      <div className="lg:col-span-5">
        <SimulationTestForm
          content={contentInfo}
          isSubmitting={isSubmitting}
          onSubmit={handleFormSubmit}
        />
      </div>

      <div className="lg:col-span-7">
        <SimulationFollowerChat
          execution={execution}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          isRetrying={isRetrying}
          isReconnecting={isReconnecting}
          connectionStatus={connectionStatus}
          error={error}
          onRetry={retry}
          onReset={reset}
        />
      </div>
    </div>
  )
}
