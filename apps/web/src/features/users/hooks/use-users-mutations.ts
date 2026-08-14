import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UsersApi } from '../services/users-api'
import { usersInvalidations } from '../services/users-invalidations'
import type { CreateUserForm, UpdateUserForm } from '../schemas'

export function useUsersMutations() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: CreateUserForm) => UsersApi.create(data),
    onSuccess: () => {
      toast.success('User created successfully')
      usersInvalidations.invalidateList(queryClient)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserForm }) =>
      UsersApi.update(id, data),
    onSuccess: () => {
      toast.success('User updated successfully')
      usersInvalidations.invalidateList(queryClient)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => UsersApi.delete(id),
    onSuccess: () => {
      toast.success('User deleted successfully')
      usersInvalidations.invalidateList(queryClient)
    },
  })

  return {
    createUser: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateUser: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteUser: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}
