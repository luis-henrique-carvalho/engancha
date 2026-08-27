import { createFileRoute } from '@tanstack/react-router'
import { AutomationStepSection } from '@/features/automations/components/automation-step-section'

export const Route = createFileRoute('/automations/$automationId/content')({
  component: ContentStepPage,
})

function ContentStepPage() {
  return (
    <AutomationStepSection
      title="Conteúdo"
      description="Selecione a publicação ou reel do Instagram associado."
    >
      <div className="text-sm text-muted-foreground">Seleção de conteúdo</div>
    </AutomationStepSection>
  )
}
