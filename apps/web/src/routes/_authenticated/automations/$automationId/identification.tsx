import { createFileRoute } from '@tanstack/react-router'
import { IdentificationStepView } from '@/features/automations/views/identification-step-view'

export const Route = createFileRoute('/_authenticated/automations/$automationId/identification')({
  component: IdentificationStepPage,
})

function IdentificationStepPage() {
  const { automationId } = Route.useParams()
  return <IdentificationStepView automationId={automationId} />
}
