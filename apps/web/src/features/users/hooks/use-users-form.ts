import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserFormSchema } from '../schemas'
import type { CreateUserForm } from '../schemas'

export function useUsersForm(defaultValues?: Partial<CreateUserForm>) {
  return useForm<CreateUserForm>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      name: '',
      email: '',
      ...defaultValues,
    },
  })
}
