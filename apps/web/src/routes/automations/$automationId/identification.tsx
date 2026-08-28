import { createFileRoute } from '@tanstack/react-router'
import { IdentificationStepView } from '@/features/automations/views/identification-step-view'

export const Route = createFileRoute('/automations/$automationId/identification')({
  component: IdentificationStepPage,
})

function IdentificationStepPage() {
  const { automationId } = Route.useParams()
  return <IdentificationStepView automationId={automationId} />
}
