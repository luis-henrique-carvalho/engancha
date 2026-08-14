import type { WorkspaceMembersListRequest, WorkspaceMembersListResponse } from '@engancha/contracts'
import { apiFetch } from '@/lib/api-client'

export const UsersApi = {
  list(params: WorkspaceMembersListRequest): Promise<WorkspaceMembersListResponse> {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .flatMap(([key, value]) =>
          Array.isArray(value) ? value.map((item) => [key, String(item)]) : [[key, String(value)]],
        ),
    )
    return apiFetch<WorkspaceMembersListResponse>(`/workspaces/active/members?${query}`)
  },

  invite(email: string): Promise<{ id: string }> {
    return apiFetch<{ id: string }>('/workspaces/active/invitations', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
}
