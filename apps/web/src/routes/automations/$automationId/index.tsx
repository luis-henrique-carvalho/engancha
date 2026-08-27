import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/automations/$automationId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/automations/$automationId/identification',
      params: { automationId: params.automationId },
    })
  },
  component: () => null,
})
