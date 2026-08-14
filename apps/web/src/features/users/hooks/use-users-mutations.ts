import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UsersApi } from '../services/users-api'
import { usersInvalidations } from '../services/users-invalidations'

export function useUsersMutations(workspaceId: string) {
  const queryClient = useQueryClient()

  const inviteMutation = useMutation({
    mutationFn: (email: string) => UsersApi.invite(email),
    onSuccess: () => {
      toast.success('Convite enviado')
      usersInvalidations.invalidateList(queryClient, workspaceId)
    },
  })

  return {
    inviteMember: inviteMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
  }
}
