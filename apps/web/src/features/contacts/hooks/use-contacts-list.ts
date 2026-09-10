import { useQuery } from '@tanstack/react-query'
import type { ContactListQuery } from '@engancha/contracts'
import { ContactsApi, contactsQueryKeys } from '../services/contacts-api'

export function useContactsList(query?: Partial<ContactListQuery>) {
  return useQuery({
    queryKey: contactsQueryKeys.list(query),
    queryFn: () => ContactsApi.list(query),
  })
}
