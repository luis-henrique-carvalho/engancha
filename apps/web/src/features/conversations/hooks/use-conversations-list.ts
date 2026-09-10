import { useQuery } from '@tanstack/react-query'
import type { ConversationListQuery } from '@engancha/contracts'
import { ConversationsApi, conversationsQueryKeys } from '../services/conversations-api'

export function useConversationsList(query?: Partial<ConversationListQuery>) {
  return useQuery({
    queryKey: conversationsQueryKeys.list(query),
    queryFn: () => ConversationsApi.list(query),
  })
}
