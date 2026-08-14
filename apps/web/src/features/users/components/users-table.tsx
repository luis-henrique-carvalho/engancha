/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useEffect, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { SortingState, VisibilityState } from '@tanstack/react-table'
import { cn } from '#/lib/utils'
import { useTableUrlState } from '#/hooks/use-table-url-state'
import type { NavigateFn } from '#/hooks/use-table-url-state'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '#/components/data-table'
import type { User } from '../data/schema'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { usersColumns as columns } from './users-columns'

type DataTableProps = {
  data: User[]
  total: number
  search: Record<string, unknown>
  navigate: NavigateFn
  isLoading?: boolean
}

export function UsersTable({
  data,
  total,
  search,
  navigate,
  isLoading,
}: DataTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search,
    navigate,
    pagination: {
      pageKey: 'page',
      pageSizeKey: 'limit',
      defaultPage: 1,
      defaultPageSize: 20,
    },
    globalFilter: { enabled: true, key: 'query' },
    columnFilters: [
      {
        columnId: 'emailVerified',
        searchKey: 'emailVerified',
        type: 'array',
        serialize: (value) => {
          const values = Array.isArray(value) ? value : []
          return values.length === 1 ? values[0] : undefined
        },
        deserialize: (value) => {
          if (typeof value !== 'boolean') return []
          return [String(value)]
        },
      },
    ],
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    manualFiltering: true,
    manualPagination: true,
    rowCount: total,
    enableRowSelection: true,
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  useEffect(() => {
    ensurePageInRange(table.getPageCount())
  }, [table, ensurePageInRange])

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        'flex flex-1 flex-col gap-4',
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder="Search users by name..."
        filters={[
          {
            columnId: 'emailVerified',
            title: 'Email verified',
            options: [
              { label: 'Verified', value: 'true' },
              { label: 'Unverified', value: 'false' },
            ],
          },
        ]}
      />
      <div className="relative overflow-hidden rounded-md border">
        {isLoading && data.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-10 h-0.5 w-full bg-primary/10 overflow-hidden">
            <div className="h-full bg-primary animate-pulse w-full" />
          </div>
        )}
        <Table className="min-w-xl">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        header.column.columnDef.meta?.className,
                        header.column.columnDef.meta?.thClassName,
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            className={cn(
              isLoading &&
                data.length > 0 &&
                'opacity-50 pointer-events-none transition-opacity duration-200',
            )}
          >
            {isLoading && data.length === 0 ? (
              Array.from({
                length: Math.min(
                  table.getState().pagination.pageSize || 10,
                  10,
                ),
              }).map((_, rowIndex) => (
                <TableRow key={`skeleton-row-${rowIndex}`}>
                  {table.getVisibleFlatColumns().map((column) => (
                    <TableCell
                      key={`skeleton-cell-${rowIndex}-${column.id}`}
                      className={cn(
                        column.columnDef.meta?.className,
                        column.columnDef.meta?.tdClassName,
                      )}
                    >
                      {column.id === 'select' ? (
                        <Skeleton className="h-4 w-4 rounded" />
                      ) : column.id === 'actions' ? (
                        <Skeleton className="h-8 w-8 rounded-md" />
                      ) : column.id === 'status' ? (
                        <Skeleton className="h-6 w-16 rounded-full" />
                      ) : column.id === 'emailVerified' ? (
                        <Skeleton className="h-6 w-20 rounded-full" />
                      ) : column.id === 'role' ? (
                        <Skeleton className="h-5 w-24 rounded" />
                      ) : column.id === 'name' ? (
                        <Skeleton className="h-5 w-32 rounded ms-3" />
                      ) : column.id === 'email' ? (
                        <Skeleton className="h-5 w-44 rounded ms-2" />
                      ) : (
                        <Skeleton className="h-5 w-full max-w-[120px] rounded" />
                      )}
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
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName,
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div
        className={cn(
          'mt-auto flex flex-col gap-4',
          isLoading &&
            'opacity-50 pointer-events-none transition-opacity duration-200',
        )}
      >
        <DataTablePagination table={table} />
        <DataTableBulkActions table={table} />
      </div>
    </div>
  )
}
