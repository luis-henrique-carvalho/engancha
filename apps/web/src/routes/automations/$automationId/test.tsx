import { createFileRoute } from '@tanstack/react-router'
import { AutomationTestTabView } from '@/features/automations/views/automation-test-tab-view'

export const Route = createFileRoute('/automations/$automationId/test')({
  component: AutomationTestRoutePage,
})

function AutomationTestRoutePage() {
  const { automationId } = Route.useParams()
  return <AutomationTestTabView automationId={automationId} />
}
