import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTablePagination } from '@/components/data-table'
import type {
  ConversationListQuery,
  ConversationSummary,
  PaginationMeta,
} from '@engancha/contracts'
import { ArrowRight, MessageSquare, Search, Tag as TagIcon } from 'lucide-react'

type Props = {
  data: ConversationSummary[]
  isLoading: boolean
  meta: PaginationMeta
  params: Partial<ConversationListQuery>
  onParamsChange: (params: Partial<ConversationListQuery>) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (limit: number) => void
}

export function ConversationsTable({
  data,
  isLoading,
  meta,
  params,
  onParamsChange,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const [searchInput, setSearchInput] = useState(params.query ?? '')

  const columns: ColumnDef<ConversationSummary>[] = [
    {
      accessorKey: 'contact',
      header: 'Contato',
      cell: ({ row }) => {
        const contact = row.original.contact
        const displayName = contact.username ? `@${contact.username}` : (contact.name ?? contact.id)
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{displayName}</span>
            {contact.email && (
              <span className="text-xs text-muted-foreground">{contact.email}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'lastMessage',
      header: 'Última mensagem',
      cell: ({ row }) => {
        const lastMsg = row.original.lastMessage
        if (!lastMsg)
          return <span className="text-xs text-muted-foreground italic">Sem mensagens</span>
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

  const pagination: PaginationState = {
    pageIndex: Math.max(0, meta.page - 1),
    pageSize: meta.limit,
  }

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    rowCount: meta.total,
    manualPagination: true,
    onPaginationChange: (next) => {
      const resolved = typeof next === 'function' ? next(pagination) : next
      if (resolved.pageSize !== pagination.pageSize) onPageSizeChange(resolved.pageSize)
      else onPageChange(resolved.pageIndex + 1)
    },
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onParamsChange({ ...params, query: searchInput.trim() || undefined, page: 1 })
          }}
          className="flex items-center gap-2 max-w-sm flex-1"
        >
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por contato, e-mail ou mensagem..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            className="h-9"
          >
            Buscar
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Select
            value={params.hasLead === undefined ? 'ALL' : params.hasLead ? 'LEAD' : 'NO_LEAD'}
            onValueChange={(val) => {
              const hasLead = val === 'ALL' ? undefined : val === 'LEAD'
              onParamsChange({ ...params, hasLead, page: 1 })
            }}
          >
            <SelectTrigger className="h-9 w-[150px] text-xs">
              <SelectValue placeholder="Filtro de Lead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os contatos</SelectItem>
              <SelectItem value="LEAD">Apenas Leads</SelectItem>
              <SelectItem value="NO_LEAD">Sem Lead</SelectItem>
            </SelectContent>
          </Select>

          {(params.query || params.hasLead !== undefined) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchInput('')
                onParamsChange({ page: 1, limit: params.limit })
              }}
              className="h-9 text-xs"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="p-4"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <MessageSquare className="size-6 text-muted-foreground/60" />
                    <span>
                      {params.query ||
                      params.hasLead !== undefined ||
                      params.automationId ||
                      params.tagId
                        ? 'Nenhuma conversa encontrada para os filtros aplicados.'
                        : 'Nenhuma conversa registrada ainda neste workspace.'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}
