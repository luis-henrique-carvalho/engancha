import { createFileRoute } from '@tanstack/react-router'
import { ContentStepView } from '@/features/automations/views/content-step-view'

export const Route = createFileRoute('/_authenticated/automations/$automationId/content')({
  component: ContentStepPage,
})

function ContentStepPage() {
  const { automationId } = Route.useParams()
  return <ContentStepView automationId={automationId} />
}
