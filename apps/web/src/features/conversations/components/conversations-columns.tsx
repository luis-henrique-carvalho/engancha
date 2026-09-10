import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import type { ConversationSummary } from '@engancha/contracts'
import { ArrowRight, Tag as TagIcon } from 'lucide-react'

export const conversationsColumns: ColumnDef<ConversationSummary>[] = [
  {
    accessorKey: 'contact',
    header: 'Contato',
    cell: ({ row }) => {
      const contact = row.original.contact
      const displayName = contact.username ? `@${contact.username}` : (contact.name ?? contact.id)
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{displayName}</span>
          {contact.email && <span className="text-xs text-muted-foreground">{contact.email}</span>}
        </div>
      )
    },
  },
  {
    accessorKey: 'lastMessage',
    header: 'Última mensagem',
    cell: ({ row }) => {
      const lastMsg = row.original.lastMessage
      if (!lastMsg) {
        return <span className="text-xs text-muted-foreground italic">Sem mensagens</span>
      }
      const isOutbound = lastMsg.direction === 'OUTBOUND'
      return (
        <div className="flex max-w-[280px] flex-col">
          <span className="truncate text-sm text-foreground">
            {isOutbound ? 'Resposta: ' : 'Comentário: '}
            {lastMsg.text ?? 'Conteúdo interativo'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(lastMsg.createdAt).toLocaleString('pt-BR')}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'provider',
    header: 'Canal',
    cell: ({ row }) => {
      const { provider, mode } = row.original
      return (
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="text-xs"
          >
            {provider}
          </Badge>
          {mode === 'SIMULATED' && (
            <Badge
              variant="secondary"
              className="text-[10px]"
            >
              Simulado
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'automation',
    header: 'Automação',
    cell: ({ row }) => {
      const automation = row.original.automation
      if (!automation) return <span className="text-xs text-muted-foreground">—</span>
      return (
        <Badge
          variant="outline"
          className="text-xs font-normal max-w-[150px] truncate"
        >
          {automation.name}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'lead',
    header: 'Lead',
    cell: ({ row }) => {
      const lead = row.original.lead
      if (!lead) return <span className="text-xs text-muted-foreground">—</span>
      return (
        <Badge
          variant="default"
          className="bg-emerald-600 hover:bg-emerald-700 text-[11px]"
        >
          Lead Capturado
        </Badge>
      )
    },
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    cell: ({ row }) => {
      const tags = row.original.tags
      if (!tags.length) return <span className="text-xs text-muted-foreground">—</span>
      return (
        <div className="flex flex-wrap gap-1 max-w-[180px]">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-[10px] gap-1 px-1.5 py-0.5"
            >
              <TagIcon className="size-2.5" />
              {tag.name}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Link
        to="/conversations/$conversationId"
        params={{ conversationId: row.original.id }}
        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent text-muted-foreground hover:text-foreground"
        title="Ver conversa"
      >
        <ArrowRight className="size-4" />
      </Link>
    ),
  },
]
