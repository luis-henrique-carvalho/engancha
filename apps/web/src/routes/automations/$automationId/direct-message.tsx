import { createFileRoute } from '@tanstack/react-router'
import { AutomationStepSection } from '@/features/automations/components/automation-step-section'

export const Route = createFileRoute('/automations/$automationId/direct-message')({
  component: DirectMessageStepPage,
})

function DirectMessageStepPage() {
  return (
    <AutomationStepSection
      title="Mensagem direta (DM)"
      description="Defina o texto enviado diretamente no direct."
    >
      <div className="text-sm text-muted-foreground">Configuração de DM</div>
    </AutomationStepSection>
  )
}
