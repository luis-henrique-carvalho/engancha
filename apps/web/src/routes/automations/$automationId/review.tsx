import { createFileRoute } from '@tanstack/react-router'
import { AutomationStepSection } from '@/features/automations/components/automation-step-section'

export const Route = createFileRoute('/automations/$automationId/review')({
  component: ReviewStepPage,
})

function ReviewStepPage() {
  return (
    <AutomationStepSection
      title="Revisão e publicação"
      description="Valide a integridade do fluxo e publique a automação."
    >
      <div className="text-sm text-muted-foreground">Revisão da automação</div>
    </AutomationStepSection>
  )
}
