import { createFileRoute } from '@tanstack/react-router'
import { AutomationStepSection } from '@/features/automations/components/automation-step-section'

export const Route = createFileRoute('/automations/$automationId/identification')({
  component: IdentificationStepPage,
})

function IdentificationStepPage() {
  return (
    <AutomationStepSection
      title="Identificação"
      description="Defina o nome da automação para organização interna."
    >
      <div className="text-sm text-muted-foreground">Configuração de identificação</div>
    </AutomationStepSection>
  )
}
