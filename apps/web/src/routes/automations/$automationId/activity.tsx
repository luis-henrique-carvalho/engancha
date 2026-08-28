import { createFileRoute } from '@tanstack/react-router'
import { AutomationActivityTabView } from '@/features/automations/views/automation-activity-tab-view'

export const Route = createFileRoute('/automations/$automationId/activity')({
  component: AutomationActivityRoutePage,
})

function AutomationActivityRoutePage() {
  const { automationId } = Route.useParams()

  return (
    <div data-testid="automation-activity-tab">
      <AutomationActivityTabView automationId={automationId} />
    </div>
  )
}
