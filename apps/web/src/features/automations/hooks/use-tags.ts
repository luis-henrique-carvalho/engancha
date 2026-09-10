import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateTagRequest } from '@engancha/contracts'
import { AutomationsApi } from '../services/automations-api'
import { automationsKeys } from '../services/automations-query-keys'

export function useTags(workspaceId: string) {
  const queryClient = useQueryClient()

  const tagsQuery = useQuery({
    queryKey: automationsKeys.tags(workspaceId),
    queryFn: () => AutomationsApi.listTags(),
    enabled: Boolean(workspaceId),
  })

  const createTagMutation = useMutation({
    mutationFn: (body: CreateTagRequest) => AutomationsApi.createTag(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: automationsKeys.tags(workspaceId),
      })
    },
  })

  return {
    tags: tagsQuery.data?.items ?? [],
    isLoading: tagsQuery.isLoading,
    error: tagsQuery.error,
    createTag: createTagMutation.mutateAsync,
    isCreating: createTagMutation.isPending,
  }
}
