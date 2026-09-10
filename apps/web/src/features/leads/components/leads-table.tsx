import { useEffect, useState } from 'react'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
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
import type { CursorPaginationMeta, LeadListQuery, LeadSummary } from '@engancha/contracts'
import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-react'
import { leadsColumns } from './leads-columns'

type ToolbarProps = {
  params: Partial<LeadListQuery>
  hasActiveFilters: boolean
  onParamsChange: (params: Partial<LeadListQuery>) => void
}

function LeadsTableToolbar({ params, hasActiveFilters, onParamsChange }: ToolbarProps) {
  const [searchInput, setSearchInput] = useState(params.query ?? '')

  useEffect(() => {
    setSearchInput(params.query ?? '')
  }, [params.query])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onParamsChange({
            ...params,
            query: searchInput.trim() || undefined,
            cursor: undefined,
          })
        }}
        className="flex items-center gap-2 max-w-sm flex-1"
      >
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lead por contato, @handle ou e-mail..."
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
            onParamsChange({
              ...params,
              provider: val === 'ALL' ? undefined : [val as 'INSTAGRAM' | 'TIKTOK'],
              cursor: undefined,
            })
          }}
        >
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos canais</SelectItem>
            <SelectItem value="INSTAGRAM">Instagram</SelectItem>
            <SelectItem value="TIKTOK">TikTok</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchInput('')
              onParamsChange({
                limit: params.limit,
                cursor: undefined,
              })
            }}
            className="h-9 text-xs"
          >
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  )
}

type PaginationBarProps = {
  dataLength: number
  meta: CursorPaginationMeta
  canGoBack: boolean
  isLoading: boolean
  onNextPage: () => void
  onPrevPage: () => void
}

function LeadsPaginationBar({
  dataLength,
  meta,
  canGoBack,
  isLoading,
  onNextPage,
  onPrevPage,
}: PaginationBarProps) {
  return (
    <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
      <div>
        {meta.total !== undefined ? (
          <span>
            Total: {meta.total} {meta.total === 1 ? 'lead' : 'leads'}
          </span>
        ) : (
          <span>
            {dataLength} {dataLength === 1 ? 'lead exibido' : 'leads exibidos'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={!canGoBack || isLoading}
          className="h-8 gap-1"
        >
          <ChevronLeft className="size-4" />
          <span>Anterior</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!meta.hasNextPage || isLoading}
          className="h-8 gap-1"
        >
          <span>Próxima</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

type Props = {
  data: LeadSummary[]
  isLoading: boolean
  meta: CursorPaginationMeta
  params: Partial<LeadListQuery>
  cursorHistory: (string | undefined)[]
  onParamsChange: (params: Partial<LeadListQuery>) => void
  onNextPage: () => void
  onPrevPage: () => void
}

export function LeadsTable({
  data,
  isLoading,
  meta,
  params,
  cursorHistory,
  onParamsChange,
  onNextPage,
  onPrevPage,
}: Props) {
  const table = useReactTable({
    data,
    columns: leadsColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const hasActiveFilters = Boolean(
    params.query ||
      (params.provider && params.provider.length > 0) ||
      (params.mode && params.mode.length > 0) ||
      params.automationId ||
      params.tagId,
  )

  const canGoBack = cursorHistory.length > 0

  return (
    <div className="space-y-4">
      <LeadsTableToolbar
        params={params}
        hasActiveFilters={hasActiveFilters}
        onParamsChange={onParamsChange}
      />

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {leadsColumns.map((_, colIndex) => (
                    <TableCell key={`col-${colIndex}`}>
                      <Skeleton className="h-6 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
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
                  colSpan={leadsColumns.length}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Users className="size-8 opacity-40" />
                    <p className="text-sm font-medium">
                      {hasActiveFilters
                        ? 'Nenhum lead encontrado com os filtros aplicados.'
                        : 'Nenhum lead registrado ainda neste workspace.'}
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          onParamsChange({
                            limit: params.limit,
                            cursor: undefined,
                          })
                        }}
                      >
                        Redefinir filtros
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <LeadsPaginationBar
        dataLength={data.length}
        meta={meta}
        canGoBack={canGoBack}
        isLoading={isLoading}
        onNextPage={onNextPage}
        onPrevPage={onPrevPage}
      />
    </div>
  )
}
