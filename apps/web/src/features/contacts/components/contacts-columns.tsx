import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import type { ContactSummary } from '@engancha/contracts'
import { Mail, Tag as TagIcon } from 'lucide-react'

export const contactsColumns: ColumnDef<ContactSummary>[] = [
  {
    accessorKey: 'identity',
    header: 'Identidade Social',
    cell: ({ row }) => {
      const contact = row.original
      const displayName = contact.username ? `@${contact.username}` : (contact.name ?? contact.id)
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{displayName}</span>
          {contact.name && contact.username && (
            <span className="text-xs text-muted-foreground">{contact.name}</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'email',
    header: 'E-mail Capturado',
    cell: ({ row }) => {
      const email = row.original.email
      if (!email) {
        return <span className="text-xs text-muted-foreground italic">Pendente de captura</span>
      }
      return (
        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <Mail className="size-3.5 text-muted-foreground" />
          <span>{email}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'provider',
    header: 'Origem',
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
    accessorKey: 'leadState',
    header: 'Estado de Lead',
    cell: ({ row }) => {
      const { isLead, lead } = row.original
      if (!isLead || !lead) {
        return <span className="text-xs text-muted-foreground">Contato</span>
      }
      return (
        <div className="flex flex-col">
          <Badge
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700 text-[11px] w-fit"
          >
            Lead Convertido
          </Badge>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            Desde {new Date(lead.capturedAt).toLocaleDateString('pt-BR')}
          </span>
        </div>
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
        <div className="flex flex-wrap gap-1 max-w-[200px]">
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
    accessorKey: 'lastInteractionAt',
    header: 'Última Interação',
    cell: ({ row }) => {
      const date = row.original.lastInteractionAt ?? row.original.createdAt
      return (
        <span className="text-xs text-muted-foreground">
          {new Date(date).toLocaleString('pt-BR')}
        </span>
      )
    },
  },
]
