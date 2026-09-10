import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/automations/$automationId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/automations/$automationId/identification',
      params: { automationId: params.automationId },
    })
  },
  component: () => null,
})
