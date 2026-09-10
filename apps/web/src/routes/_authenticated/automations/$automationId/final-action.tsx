import { createFileRoute } from '@tanstack/react-router'
import { FinalActionStepView } from '@/features/automations/views/final-action-step-view'

export const Route = createFileRoute('/_authenticated/automations/$automationId/final-action')({
  component: FinalActionStepPage,
})

function FinalActionStepPage() {
  return <FinalActionStepView />
}
