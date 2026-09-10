import type { ActiveWorkspaceResponse } from '@engancha/contracts'
import { apiFetch } from '@/lib/api-client'

export function bootstrapWorkspace() {
  return apiFetch<ActiveWorkspaceResponse>('/workspaces/bootstrap', { method: 'POST' })
}
