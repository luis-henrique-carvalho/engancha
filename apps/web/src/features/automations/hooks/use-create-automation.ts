import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateAutomationRequest } from '@engancha/contracts'
import { AutomationsApi } from '../services/automations-api'
import { invalidateAutomationsList } from '../services/automations-invalidations'

export function useCreateAutomation(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body?: CreateAutomationRequest) => AutomationsApi.create(body),
    onSuccess: () => {
      void invalidateAutomationsList(queryClient, workspaceId)
    },
  })
}
