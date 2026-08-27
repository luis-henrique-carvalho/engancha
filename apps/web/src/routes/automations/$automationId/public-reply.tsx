import { createFileRoute } from '@tanstack/react-router'
import { AutomationStepSection } from '@/features/automations/components/automation-step-section'

export const Route = createFileRoute('/automations/$automationId/public-reply')({
  component: PublicReplyStepPage,
})

function PublicReplyStepPage() {
  return (
    <AutomationStepSection
      title="Resposta pública"
      description="Defina o comentário de resposta visível no post."
    >
      <div className="text-sm text-muted-foreground">Configuração de resposta pública</div>
    </AutomationStepSection>
  )
}
