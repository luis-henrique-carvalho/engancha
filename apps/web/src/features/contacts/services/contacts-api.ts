import {
  type ContactListQuery,
  type ContactListResponse,
  contactListResponseSchema,
} from '@engancha/contracts'
import { apiFetch } from '@/lib/api-client'

export const contactsQueryKeys = {
  all: ['contacts'] as const,
  list: (params?: Partial<ContactListQuery>) => [...contactsQueryKeys.all, 'list', params] as const,
}

export const ContactsApi = {
  async list(query?: Partial<ContactListQuery>): Promise<ContactListResponse> {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined && value !== '')
        .flatMap(([key, value]) =>
          Array.isArray(value) ? value.map((item) => [key, String(item)]) : [[key, String(value)]],
        ),
    )

    const queryString = params.toString()
    const path = queryString ? `/contacts?${queryString}` : '/contacts'

    const data = await apiFetch<unknown>(path)
    return contactListResponseSchema.parse(data)
  },
}
