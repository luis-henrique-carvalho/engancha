import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type PaginationState,
} from '@tanstack/react-table'
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
import type { ContactListQuery, ContactSummary, PaginationMeta } from '@engancha/contracts'
import { Search, Users } from 'lucide-react'
import { contactsColumns } from './contacts-columns'

type Props = {
  data: ContactSummary[]
  isLoading: boolean
  meta: PaginationMeta
  params: Partial<ContactListQuery>
  onParamsChange: (params: Partial<ContactListQuery>) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (limit: number) => void
}

export function ContactsTable({
  data,
  isLoading,
  meta,
  params,
  onParamsChange,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const [searchInput, setSearchInput] = useState(params.query ?? '')
  const pagination: PaginationState = {
    pageIndex: Math.max(0, meta.page - 1),
    pageSize: meta.limit,
  }

  const table = useReactTable({
    data,
    columns: contactsColumns,
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
              placeholder="Buscar por @handle, nome ou e-mail..."
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
            value={params.provider?.[0] ?? 'ALL'}
            onValueChange={(val) => {
              const provider = val === 'ALL' ? undefined : [val as 'INSTAGRAM' | 'TIKTOK']
              onParamsChange({ ...params, provider, page: 1 })
            }}
          >
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os canais</SelectItem>
              <SelectItem value="INSTAGRAM">Instagram</SelectItem>
              <SelectItem value="TIKTOK">TikTok</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={params.leadState ?? 'ALL'}
            onValueChange={(val) => {
              const leadState = val as ContactListQuery['leadState']
              onParamsChange({ ...params, leadState, page: 1 })
            }}
          >
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <SelectValue placeholder="Estado de Lead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os contatos</SelectItem>
              <SelectItem value="LEAD">Apenas Leads</SelectItem>
              <SelectItem value="NOT_LEAD">Apenas Contatos</SelectItem>
            </SelectContent>
          </Select>

          {(params.query || params.leadState || params.provider?.length) && (
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
                  colSpan={6}
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
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="size-6 text-muted-foreground/60" />
                    <span>
                      {params.query || params.leadState || params.provider?.length
                        ? 'Nenhum contato encontrado para os filtros aplicados.'
                        : 'Nenhum contato registrado ainda neste workspace.'}
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
