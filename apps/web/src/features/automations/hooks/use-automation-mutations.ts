import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PatchAutomationRequest } from '@engancha/contracts'
import { toast } from 'sonner'
import { AutomationsApi } from '../services/automations-api'
import { invalidateAutomationsList } from '../services/automations-invalidations'
import { automationsKeys } from '../services/automations-query-keys'

export function useAutomationMutations(workspaceId: string, automationId: string) {
  const queryClient = useQueryClient()

  const patchMutation = useMutation({
    mutationFn: (body: PatchAutomationRequest) => AutomationsApi.patch(automationId, body),
    onSuccess: (updatedAutomation) => {
      queryClient.setQueryData(automationsKeys.detail(workspaceId, automationId), updatedAutomation)
      void invalidateAutomationsList(queryClient, workspaceId)
      toast.success('Etapa salva com sucesso')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar a etapa')
    },
  })

  const publishMutation = useMutation({
    mutationFn: () => AutomationsApi.publish(automationId),
    onSuccess: (updatedAutomation) => {
      queryClient.setQueryData(automationsKeys.detail(workspaceId, automationId), updatedAutomation)
      void invalidateAutomationsList(queryClient, workspaceId)
      toast.success('Automação publicada com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Não foi possível publicar a automação')
    },
  })

  const pauseMutation = useMutation({
    mutationFn: () => AutomationsApi.pause(automationId),
    onSuccess: (updatedAutomation) => {
      queryClient.setQueryData(automationsKeys.detail(workspaceId, automationId), updatedAutomation)
      void invalidateAutomationsList(queryClient, workspaceId)
      toast.success('Automação pausada com sucesso')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Não foi possível pausar a automação')
    },
  })

  return {
    patchAutomation: patchMutation.mutateAsync,
    isSaving: patchMutation.isPending,
    publishAutomation: publishMutation.mutateAsync,
    isPublishing: publishMutation.isPending,
    pauseAutomation: pauseMutation.mutateAsync,
    isPausing: pauseMutation.isPending,
  }
}
