import { createFileRoute } from '@tanstack/react-router'
import { DirectMessageStepView } from '@/features/automations/views/direct-message-step-view'

export const Route = createFileRoute('/_authenticated/automations/$automationId/direct-message')({
  component: DirectMessageStepPage,
})

function DirectMessageStepPage() {
  return <DirectMessageStepView />
}
