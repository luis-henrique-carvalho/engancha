import { createFileRoute } from '@tanstack/react-router'
import { KeywordStepView } from '@/features/automations/views'

export const Route = createFileRoute('/automations/$automationId/keyword')({
  component: KeywordStepPage,
})

function KeywordStepPage() {
  const { automationId } = Route.useParams()
  return <KeywordStepView automationId={automationId} />
}
