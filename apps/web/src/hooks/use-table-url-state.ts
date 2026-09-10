import { useMemo, useState } from 'react'
import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
} from '@tanstack/react-table'

type SearchRecord = Record<string, unknown>

export type NavigateFn = (opts: {
  search:
    | true
    | SearchRecord
    | ((prev: SearchRecord) => Partial<SearchRecord> | SearchRecord)
  replace?: boolean
}) => void

type UseTableUrlStateParams = {
  search: SearchRecord
  navigate: NavigateFn
  pagination?: {
    pageKey?: string
    pageSizeKey?: string
    defaultPage?: number
    defaultPageSize?: number
  }
  globalFilter?: {
    enabled?: boolean
    key?: string
    trim?: boolean
  }
  columnFilters?: Array<
    | {
        columnId: string
        searchKey: string
        type?: 'string'
        // Optional transformers for custom types
        serialize?: (value: unknown) => unknown
        deserialize?: (value: unknown) => unknown
      }
    | {
        columnId: string
        searchKey: string
        type: 'array'
        serialize?: (value: unknown) => unknown
        deserialize?: (value: unknown) => unknown
      }
  >
}

type UseTableUrlStateReturn = {
  // Global filter
  globalFilter?: string
  onGlobalFilterChange?: OnChangeFn<string>
  // Column filters
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>
  // Pagination
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  // Helpers
  ensurePageInRange: (
    pageCount: number,
    opts?: { resetTo?: 'first' | 'last' }
  ) => void
}

function buildInitialColumnFilters(
  columnFiltersCfg: NonNullable<UseTableUrlStateParams['columnFilters']>,
  search: SearchRecord,
): ColumnFiltersState {
  const collected: ColumnFiltersState = []
  for (const cfg of columnFiltersCfg) {
    const raw = search[cfg.searchKey]
    const deserialize = cfg.deserialize ?? ((v: unknown) => v)
    if (cfg.type === 'string') {
      const value = (deserialize(raw) as string) ?? ''
      if (typeof value === 'string' && value.trim() !== '') {
        collected.push({ id: cfg.columnId, value })
      }
    } else {
      const value = (deserialize(raw) as unknown[]) ?? []
      if (Array.isArray(value) && value.length > 0) {
        collected.push({ id: cfg.columnId, value })
      }
    }
  }
  return collected
}

function buildColumnFiltersPatch(
  filters: ColumnFiltersState,
  columnFiltersCfg: NonNullable<UseTableUrlStateParams['columnFilters']>,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  for (const cfg of columnFiltersCfg) {
    const found = filters.find((f) => f.id === cfg.columnId)
    const serialize = cfg.serialize ?? ((v: unknown) => v)
    if (cfg.type === 'string') {
      const value = typeof found?.value === 'string' ? (found.value as string) : ''
      patch[cfg.searchKey] = value.trim() !== '' ? serialize(value) : undefined
    } else {
      const value = Array.isArray(found?.value) ? (found!.value as unknown[]) : []
      patch[cfg.searchKey] = value.length > 0 ? serialize(value) : undefined
    }
  }
  return patch
}

function useTablePagination(
  search: SearchRecord,
  navigate: NavigateFn,
  paginationCfg: UseTableUrlStateParams['pagination'],
) {
  const pageKey = paginationCfg?.pageKey ?? 'page'
  const pageSizeKey = paginationCfg?.pageSizeKey ?? 'pageSize'
  const defaultPage = paginationCfg?.defaultPage ?? 1
  const defaultPageSize = paginationCfg?.defaultPageSize ?? 10

  const pagination: PaginationState = useMemo(() => {
    const rawPage = search[pageKey]
    const rawPageSize = search[pageSizeKey]
    const pageNum = typeof rawPage === 'number' ? rawPage : defaultPage
    const pageSizeNum = typeof rawPageSize === 'number' ? rawPageSize : defaultPageSize
    return { pageIndex: Math.max(0, pageNum - 1), pageSize: pageSizeNum }
  }, [search, pageKey, pageSizeKey, defaultPage, defaultPageSize])

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === 'function' ? updater(pagination) : updater
    const nextPage = next.pageIndex + 1
    const nextPageSize = next.pageSize
    navigate({
      search: (prev) => ({
        ...(prev as SearchRecord),
        [pageKey]: nextPage <= defaultPage ? undefined : nextPage,
        [pageSizeKey]: nextPageSize === defaultPageSize ? undefined : nextPageSize,
      }),
    })
  }

  const ensurePageInRange = (
    pageCount: number,
    opts: { resetTo?: 'first' | 'last' } = { resetTo: 'first' },
  ) => {
    const currentPage = search[pageKey]
    const pageNum = typeof currentPage === 'number' ? currentPage : defaultPage
    if (pageCount > 0 && pageNum > pageCount) {
      navigate({
        replace: true,
        search: (prev) => ({
          ...(prev as SearchRecord),
          [pageKey]: opts.resetTo === 'last' ? pageCount : undefined,
        }),
      })
    }
  }

  return { pageKey, pagination, onPaginationChange, ensurePageInRange }
}

function useTableGlobalFilter(
  search: SearchRecord,
  navigate: NavigateFn,
  globalFilterCfg: UseTableUrlStateParams['globalFilter'],
  pageKey: string,
) {
  const globalFilterKey = globalFilterCfg?.key ?? 'filter'
  const globalFilterEnabled = globalFilterCfg?.enabled ?? true
  const trimGlobal = globalFilterCfg?.trim ?? true

  const [globalFilter, setGlobalFilter] = useState<string | undefined>(() => {
    if (!globalFilterEnabled) return undefined
    const raw = search[globalFilterKey]
    return typeof raw === 'string' ? raw : ''
  })

  const onGlobalFilterChange: OnChangeFn<string> | undefined = globalFilterEnabled
    ? (updater) => {
        const next = typeof updater === 'function' ? updater(globalFilter ?? '') : updater
        const value = trimGlobal ? next.trim() : next
        setGlobalFilter(value)
        navigate({
          search: (prev) => ({
            ...(prev as SearchRecord),
            [pageKey]: undefined,
            [globalFilterKey]: value ? value : undefined,
          }),
        })
      }
    : undefined

  return {
    globalFilter: globalFilterEnabled ? (globalFilter ?? '') : undefined,
    onGlobalFilterChange,
  }
}

function useTableColumnFilters(
  search: SearchRecord,
  navigate: NavigateFn,
  columnFiltersCfg: NonNullable<UseTableUrlStateParams['columnFilters']>,
  pageKey: string,
) {
  const initialColumnFilters = useMemo(
    () => buildInitialColumnFilters(columnFiltersCfg, search),
    [columnFiltersCfg, search],
  )
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialColumnFilters)

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    const next = typeof updater === 'function' ? updater(columnFilters) : updater
    setColumnFilters(next)
    const patch = buildColumnFiltersPatch(next, columnFiltersCfg)

    navigate({
      search: (prev) => ({
        ...(prev as SearchRecord),
        [pageKey]: undefined,
        ...patch,
      }),
    })
  }

  return { columnFilters, onColumnFiltersChange }
}

export function useTableUrlState(params: UseTableUrlStateParams): UseTableUrlStateReturn {
  const {
    search,
    navigate,
    pagination: paginationCfg,
    globalFilter: globalFilterCfg,
    columnFilters: columnFiltersCfg = [],
  } = params

  const { pageKey, pagination, onPaginationChange, ensurePageInRange } = useTablePagination(
    search,
    navigate,
    paginationCfg,
  )

  const { globalFilter, onGlobalFilterChange } = useTableGlobalFilter(
    search,
    navigate,
    globalFilterCfg,
    pageKey,
  )

  const { columnFilters, onColumnFiltersChange } = useTableColumnFilters(
    search,
    navigate,
    columnFiltersCfg,
    pageKey,
  )

  return {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  }
}
