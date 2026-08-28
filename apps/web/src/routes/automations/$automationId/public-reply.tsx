import { createFileRoute } from '@tanstack/react-router'
import { PublicReplyStepView } from '@/features/automations/views/public-reply-step-view'

export const Route = createFileRoute('/automations/$automationId/public-reply')({
  component: PublicReplyStepPage,
})

function PublicReplyStepPage() {
  return <PublicReplyStepView />
}
