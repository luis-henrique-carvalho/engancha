import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateContentRequest } from '@engancha/contracts'
import { toast } from 'sonner'
import { SimulatedContentsApi } from '../services/simulated-contents-api'
import { simulatedContentsKeys } from '../services/simulated-contents-query-keys'

export function useCreateSimulatedContent(workspaceId: string) {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (body: CreateContentRequest) => SimulatedContentsApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: simulatedContentsKeys.workspace(workspaceId),
      })
      toast.success('Conteúdo simulado criado com sucesso')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Não foi possível criar o conteúdo')
    },
  })

  return {
    createSimulatedContent: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}
