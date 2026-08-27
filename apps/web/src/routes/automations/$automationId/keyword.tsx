import { createFileRoute } from '@tanstack/react-router'
import { AutomationStepSection } from '@/features/automations/components/automation-step-section'

export const Route = createFileRoute('/automations/$automationId/keyword')({
  component: KeywordStepPage,
})

function KeywordStepPage() {
  return (
    <AutomationStepSection
      title="Palavra-chave"
      description="Configure o gatilho textual que aciona a resposta."
    >
      <div className="text-sm text-muted-foreground">Configuração de palavra-chave</div>
    </AutomationStepSection>
  )
}
