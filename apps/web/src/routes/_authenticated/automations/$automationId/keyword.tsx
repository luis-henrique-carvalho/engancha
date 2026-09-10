import { createFileRoute } from '@tanstack/react-router'
import { KeywordStepView } from '@/features/automations/views/keyword-step-view'

export const Route = createFileRoute('/_authenticated/automations/$automationId/keyword')({
  component: KeywordStepPage,
})

function KeywordStepPage() {
  const { automationId } = Route.useParams()
  return <KeywordStepView automationId={automationId} />
}
