import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { AutomationResponse } from '@engancha/contracts'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ApiClientError } from '@/lib/api-client'
import { AutomationReview } from '../components/automation-review'
import { AutomationStepSection } from '../components/automation-step-section'
import { useOptionalAutomationEditor } from '../components/automation-editor-provider'
import type { AutomationStepId } from '../data/automation-readiness'
import { useAutomationMutations } from '../hooks/use-automation-mutations'
import { useAutomation } from '../hooks/use-automation'

export interface ReviewStepViewProps {
  workspaceId?: string
  automationId?: string
  automation?: AutomationResponse
  onNavigateStep?: (stepId: AutomationStepId) => void
  onPublished?: () => void
  onPaused?: () => void
}

export function ReviewStepView({
  workspaceId: propWorkspaceId,
  automationId: propAutomationId,
  automation: propAutomation,
  onNavigateStep: propOnNavigateStep,
  onPublished: propOnPublished,
  onPaused: propOnPaused,
}: ReviewStepViewProps = {}) {
  const context = useOptionalAutomationEditor()
  const navigate = useNavigate()

  const workspaceId = propWorkspaceId ?? context?.workspaceId ?? ''
  const automationId = propAutomationId ?? context?.automationId ?? ''

  const { data: fetchedAutomation } = useAutomation(
    propAutomation ? '' : workspaceId,
    propAutomation ? '' : automationId,
  )

  const activeAutomation = propAutomation ?? context?.automation ?? fetchedAutomation
  const { publishAutomation, isPublishing, pauseAutomation, isPausing } = useAutomationMutations(
    workspaceId,
    automationId,
  )

  const [publishIssues, setPublishIssues] = useState<string[] | null>(null)
  const [publishErrorMessage, setPublishErrorMessage] = useState<string | null>(null)
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false)

  const handleNavigateStep = (stepId: AutomationStepId) => {
    if (propOnNavigateStep) {
      propOnNavigateStep(stepId)
      return
    }

    void navigate({
      to: `/automations/$automationId/${stepId}`,
      params: { automationId },
    })
  }

  const handlePublish = async () => {
    setPublishIssues(null)
    setPublishErrorMessage(null)

    try {
      await publishAutomation()
      propOnPublished?.()
    } catch (error) {
      if (error instanceof ApiClientError && error.code === 'AUTOMATION_NOT_PUBLISHABLE') {
        const issues = Array.isArray(error.issues) ? (error.issues as string[]) : []
        setPublishIssues(issues)
        setPublishErrorMessage(
          'A automação possui requisitos obrigatórios incompletos para publicação.',
        )
      } else if (error instanceof ApiClientError && error.code === 'AUTOMATION_TRIGGER_CONFLICT') {
        setPublishIssues(['targetId', 'keyword'])
        setPublishErrorMessage(
          'Já existe outra automação ativa configurada para a mesma combinação de conteúdo e palavra-chave.',
        )
      } else if (error instanceof ApiClientError && error.code === 'AUTOMATION_ARCHIVED') {
        setPublishErrorMessage(
          'Esta automação está arquivada e não pode mais ser publicada ou modificada.',
        )
      } else {
        setPublishErrorMessage(
          error instanceof Error ? error.message : 'Falha inesperada ao publicar a automação.',
        )
      }
    }
  }

  const handleConfirmPause = async () => {
    try {
      await pauseAutomation()
      setIsPauseDialogOpen(false)
      propOnPaused?.()
    } catch {
      // Handled by toast in useAutomationMutations
    }
  }

  if (!activeAutomation) {
    return (
      <AutomationStepSection
        title="Revisão e publicação"
        description="Valide a integridade do fluxo e publique a automação."
      >
        <div className="text-sm text-muted-foreground">Carregando automação...</div>
      </AutomationStepSection>
    )
  }

  return (
    <>
      <AutomationStepSection
        title="Revisão e publicação"
        description="Valide a integridade do fluxo e publique a automação."
      >
        <AutomationReview
          automation={activeAutomation}
          workspaceId={workspaceId}
          automationId={automationId}
          onNavigateStep={handleNavigateStep}
          onPublish={handlePublish}
          onPause={() => setIsPauseDialogOpen(true)}
          isPublishing={isPublishing}
          isPausing={isPausing}
          publishIssues={publishIssues}
          publishErrorMessage={publishErrorMessage}
        />
      </AutomationStepSection>

      <ConfirmDialog
        open={isPauseDialogOpen}
        onOpenChange={setIsPauseDialogOpen}
        title="Pausar automação"
        desc="Deseja pausar esta automação? Ela deixará de responder novos comentários e DMs imediatamente."
        confirmText="Pausar"
        cancelBtnText="Cancelar"
        destructive
        isLoading={isPausing}
        handleConfirm={handleConfirmPause}
      />
    </>
  )
}
