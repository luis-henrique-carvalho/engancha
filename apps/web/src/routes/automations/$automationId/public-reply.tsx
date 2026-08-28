import { createFileRoute } from '@tanstack/react-router'
import { PublicReplyStepView } from '@/features/automations/views'

export const Route = createFileRoute('/automations/$automationId/public-reply')({
  component: PublicReplyStepPage,
})

function PublicReplyStepPage() {
  return <PublicReplyStepView />
}

