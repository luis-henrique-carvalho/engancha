import { createFileRoute } from '@tanstack/react-router'
import { AutomationStepSection } from '@/features/automations/components/automation-step-section'

export const Route = createFileRoute('/automations/$automationId/final-action')({
  component: FinalActionStepPage,
})

function FinalActionStepPage() {
  return (
    <AutomationStepSection
      title="Ação final"
      description="Configure o link de destino ou captura de e-mail."
    >
      <div className="text-sm text-muted-foreground">Configuração da ação final</div>
    </AutomationStepSection>
  )
}
