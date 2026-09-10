import { createFileRoute } from '@tanstack/react-router'
import { ReviewStepView } from '@/features/automations/views/review-step-view'

export const Route = createFileRoute('/_authenticated/automations/$automationId/review')({
  component: ReviewStepPage,
})

function ReviewStepPage() {
  return <ReviewStepView />
}
