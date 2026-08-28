import { createFileRoute } from '@tanstack/react-router'
import type {
  ContentMode,
  ContentProvider,
  ContentType,
  ExecutionOutputType,
  ExecutionStatus,
} from '@engancha/contracts'
import type { ActivityFilters } from '@/features/automations/data/activity-filter-options'
import { AutomationActivityTabView } from '@/features/automations/views/automation-activity-tab-view'

export interface ActivitySearch {
  query?: string
  status?: ExecutionStatus[]
  provider?: ContentProvider[]
  mode?: ContentMode[]
  contentType?: ContentType[]
  outputType?: ExecutionOutputType[]
  page?: number
  limit?: number
}

function parseArrayParam<T extends string>(value: unknown, allowed: readonly T[]): T[] | undefined {
  const values = Array.isArray(value) ? value : [value]
  const selected = values.filter(
    (item): item is T => typeof item === 'string' && (allowed as readonly string[]).includes(item),
  )
  return selected.length ? selected : undefined
}

export const Route = createFileRoute('/automations/$automationId/activity')({
  validateSearch: (search: Record<string, unknown>): ActivitySearch => ({
    query:
      typeof search.query === 'string' && search.query.trim() ? search.query.trim() : undefined,
    status: parseArrayParam(search.status, [
      'PENDING',
      'PROCESSING',
      'COMPLETED',
      'IGNORED',
      'FAILED',
    ] as const),
    provider: parseArrayParam(search.provider, ['INSTAGRAM', 'TIKTOK'] as const),
    mode: parseArrayParam(search.mode, ['SIMULATED', 'REAL'] as const),
    contentType: parseArrayParam(search.contentType, ['POST', 'VIDEO'] as const),
    outputType: parseArrayParam(search.outputType, [
      'PUBLIC_REPLY',
      'PRIVATE_REPLY',
      'LINK_DELIVERY',
      'EMAIL_CAPTURE_REQUEST',
    ] as const),
    page:
      typeof search.page === 'number' && search.page >= 1
        ? search.page
        : typeof search.page === 'string' && Number(search.page) >= 1
          ? Number(search.page)
          : 1,
    limit:
      typeof search.limit === 'number' && search.limit >= 1
        ? search.limit
        : typeof search.limit === 'string' && Number(search.limit) >= 1
          ? Number(search.limit)
          : 20,
  }),
  component: AutomationActivityRoutePage,
})

function AutomationActivityRoutePage() {
  const { automationId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const handleQueryChange = (nextQuery?: string) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        query: nextQuery,
        page: 1,
      }),
    })
  }

  const handleFiltersChange = (nextFilters: ActivityFilters) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...nextFilters,
        page: 1,
      }),
    })
  }

  const handlePageChange = (nextPage: number) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        page: nextPage,
      }),
    })
  }

  const handlePageSizeChange = (nextLimit: number) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        limit: nextLimit,
        page: 1,
      }),
    })
  }

  const handleReset = () => {
    void navigate({
      search: {
        page: 1,
        limit: search.limit ?? 20,
      },
    })
  }

  const filters: ActivityFilters = {
    status: search.status,
    provider: search.provider,
    mode: search.mode,
    contentType: search.contentType,
    outputType: search.outputType,
  }

  return (
    <div data-testid="automation-activity-tab">
      <AutomationActivityTabView
        automationId={automationId}
        query={search.query}
        filters={filters}
        page={search.page}
        limit={search.limit}
        onQueryChange={handleQueryChange}
        onFiltersChange={handleFiltersChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onReset={handleReset}
      />
    </div>
  )
}
