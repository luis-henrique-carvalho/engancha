import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Skeleton } from '@/components/ui/skeleton'
import { useConversationDetail } from '../hooks/use-conversation-detail'
import { ConversationChat } from '../components/conversation-chat'

export function ConversationDetailHeader() {
  return (
    <Header fixed>
      <Search className="me-auto" />
      <ThemeSwitch />
      <ConfigDrawer />
      <ProfileDropdown />
    </Header>
  )
}

type Props = {
  workspaceId: string
  conversationId: string
}

export function ConversationDetailView({ conversationId }: Props) {
  const { data: conversation, isLoading, isError, refetch } = useConversationDetail(conversationId)

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full rounded-md" />
      </div>
    )
  }

  if (isError || !conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center min-h-[350px]">
        <h3 className="text-lg font-semibold">Conversa não encontrada</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          A conversa solicitada não existe ou não pertence a este workspace.
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            asChild
            size="sm"
          >
            <Link to="/conversations">Voltar para a lista</Link>
          </Button>
          <Button
            variant="secondary"
            onClick={() => void refetch()}
            size="sm"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="size-8"
        >
          <Link to="/conversations">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Conversa com{' '}
            {conversation.contact.username
              ? `@${conversation.contact.username}`
              : (conversation.contact.name ?? 'Contato')}
          </h2>
          <p className="text-xs text-muted-foreground">
            Iniciada em {new Date(conversation.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      <ConversationChat conversation={conversation} />
    </div>
  )
}
