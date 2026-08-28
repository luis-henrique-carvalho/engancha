import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { AutomationResponse } from '@engancha/contracts'
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
}

export function ReviewStepView({
  workspaceId: propWorkspaceId,
  automationId: propAutomationId,
  automation: propAutomation,
  onNavigateStep: propOnNavigateStep,
  onPublished: propOnPublished,
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
  const { publishAutomation, isPublishing } = useAutomationMutations(workspaceId, automationId)

  const [publishIssues, setPublishIssues] = useState<string[] | null>(null)
  const [publishErrorMessage, setPublishErrorMessage] = useState<string | null>(null)

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
      } else {
        setPublishErrorMessage(
          error instanceof Error ? error.message : 'Falha inesperada ao publicar a automação.',
        )
      }
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
        isPublishing={isPublishing}
        publishIssues={publishIssues}
        publishErrorMessage={publishErrorMessage}
      />
    </AutomationStepSection>
  )
}
