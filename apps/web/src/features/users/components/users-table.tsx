import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnFiltersState, PaginationState } from '@tanstack/react-table'
import type { WorkspaceMembersListRequest } from '@engancha/contracts'
import { DataTablePagination, DataTableToolbar } from '#/components/data-table'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { roles } from '../data/data'
import type { User } from '../data/schema'
import { usersColumns } from './users-columns'

type Props = {
  data: User[]
  isLoading: boolean
  meta: { page: number; limit: number; total: number; totalPages: number }
  filters: Pick<WorkspaceMembersListRequest, 'query' | 'role' | 'status'>
  onFiltersChange: (filters: Pick<WorkspaceMembersListRequest, 'query' | 'role' | 'status'>) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (limit: number) => void
}

export function UsersTable({
  data,
  isLoading,
  meta,
  filters,
  onFiltersChange,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const [columnVisibility, setColumnVisibility] = useState({})
  const columnFilters: ColumnFiltersState = [
    ...(filters.role?.length ? [{ id: 'role', value: filters.role }] : []),
    ...(filters.status?.length ? [{ id: 'status', value: filters.status }] : []),
  ]
  const pagination: PaginationState = {
    pageIndex: Math.max(0, meta.page - 1),
    pageSize: meta.limit,
  }
  const table = useReactTable({
    data,
    columns: usersColumns,
    state: { globalFilter: filters.query ?? '', columnFilters, pagination, columnVisibility },
    rowCount: meta.total,
    manualFiltering: true,
    manualPagination: true,
    onGlobalFilterChange: (value) =>
      onFiltersChange({ ...filters, query: String(value) || undefined }),
    onColumnFiltersChange: (next) => {
      const resolved = typeof next === 'function' ? next(columnFilters) : next
      const role = resolved.find((filter) => filter.id === 'role')?.value as string[] | undefined
      const status = resolved.find((filter) => filter.id === 'status')?.value as
        | string[]
        | undefined
      onFiltersChange({
        ...filters,
        role: role?.length ? (role as WorkspaceMembersListRequest['role']) : undefined,
        status: status?.length ? (status as WorkspaceMembersListRequest['status']) : undefined,
      })
    },
    onPaginationChange: (next) => {
      const resolved = typeof next === 'function' ? next(pagination) : next
      if (resolved.pageSize !== pagination.pageSize) onPageSizeChange(resolved.pageSize)
      else onPageChange(resolved.pageIndex + 1)
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchPlaceholder="Buscar por nome ou e-mail..."
        onReset={() =>
          onFiltersChange({
            query: undefined,
            role: undefined,
            status: undefined,
          })
        }
        filters={[
          {
            columnId: 'role',
            title: 'Papel',
            options: roles.map(({ label, value, icon }) => ({ label, value, icon })),
          },
          {
            columnId: 'status',
            title: 'Estado',
            options: [
              { label: 'Ativo', value: 'active' },
              { label: 'Convite pendente', value: 'invited' },
            ],
          },
        ]}
      />
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
                <TableCell colSpan={3}>
                  <Skeleton className="h-9 w-full" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
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
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  Ainda não há membros ou convites pendentes.
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
