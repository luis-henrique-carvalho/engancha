import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import type { LeadSummary } from '@engancha/contracts'
import { Bot, Calendar, Mail, Tag as TagIcon } from 'lucide-react'

export const leadsColumns: ColumnDef<LeadSummary>[] = [
  {
    accessorKey: 'contact',
    header: 'Contato',
    cell: ({ row }) => {
      const contact = row.original.contact
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
    header: 'E-mail Autorizado',
    cell: ({ row }) => {
      const email = row.original.contact.email
      if (!email) {
        return <span className="text-xs text-muted-foreground italic">—</span>
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
    accessorKey: 'capturedAt',
    header: 'Primeira Captura',
    cell: ({ row }) => {
      const capturedAt = row.original.capturedAt
      const date = new Date(capturedAt)
      return (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="size-3.5" />
          <span>{date.toLocaleString('pt-BR')}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'automation',
    header: 'Automação de Origem',
    cell: ({ row }) => {
      const automation = row.original.automation
      if (!automation) {
        return <span className="text-xs text-muted-foreground">—</span>
      }
      const automationName = automation.name?.trim() || automation.id
      return (
        <Link
          to="/automations/$automationId"
          params={{ automationId: automation.id }}
          className="inline-flex items-center gap-1.5 text-sm text-foreground hover:underline hover:text-primary transition-colors"
          title={`Ver automação: ${automationName}`}
        >
          <Bot className="size-3.5 text-muted-foreground" />
          <span>{automationName}</span>
        </Link>
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
              <TagIcon className="size-2.5 text-muted-foreground" />
              {tag.name}
            </Badge>
          ))}
        </div>
      )
    },
  },
]
