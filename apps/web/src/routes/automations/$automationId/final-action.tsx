import { createFileRoute } from '@tanstack/react-router'
import { FinalActionStepView } from '@/features/automations/views'

export const Route = createFileRoute('/automations/$automationId/final-action')({
  component: FinalActionStepPage,
})

function FinalActionStepPage() {
  return <FinalActionStepView />
}

