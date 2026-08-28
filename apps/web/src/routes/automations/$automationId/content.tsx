import { createFileRoute } from '@tanstack/react-router'
import { ContentStepView } from '@/features/automations/views'

export const Route = createFileRoute('/automations/$automationId/content')({
  component: ContentStepPage,
})

function ContentStepPage() {
  const { automationId } = Route.useParams()
  return <ContentStepView automationId={automationId} />
}
