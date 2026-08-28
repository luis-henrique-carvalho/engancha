import { createFileRoute } from '@tanstack/react-router'
import { DirectMessageStepView } from '@/features/automations/views'

export const Route = createFileRoute('/automations/$automationId/direct-message')({
  component: DirectMessageStepPage,
})

function DirectMessageStepPage() {
  return <DirectMessageStepView />
}

