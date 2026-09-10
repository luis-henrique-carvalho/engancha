import { useQuery } from '@tanstack/react-query'
import { ConversationsApi, conversationsQueryKeys } from '../services/conversations-api'

export function useConversationDetail(conversationId: string) {
  return useQuery({
    queryKey: conversationsQueryKeys.detail(conversationId),
    queryFn: () => ConversationsApi.getById(conversationId),
    enabled: Boolean(conversationId),
  })
}
