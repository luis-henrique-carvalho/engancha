import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedWorkspaceRoute } from '@/features/workspaces/views/authenticated-workspace-route'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedWorkspaceRoute,
})
