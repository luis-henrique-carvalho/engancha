import type { WorkspaceMembersResponse } from '@engancha/contracts'
import { apiFetch } from '@/lib/api-client'

export const UsersApi = {
  list(): Promise<WorkspaceMembersResponse> {
    return apiFetch<WorkspaceMembersResponse>('/workspaces/active/members')
  },

  invite(email: string): Promise<{ id: string }> {
    return apiFetch<{ id: string }>('/workspaces/active/invitations', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
}
