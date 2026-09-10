import { Cross2Icon } from '@radix-ui/react-icons'
import { DataTableFacetedFilter } from '@/components/data-table/faceted-filter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  type ActivityFilters,
  activityContentTypeOptions,
  activityModeOptions,
  activityOutputTypeOptions,
  activityProviderOptions,
  activityStatusOptions,
} from '../../data/activity-filter-options'

export interface AutomationActivityToolbarProps {
  query?: string
  onQueryChange: (query?: string) => void
  filters: ActivityFilters
  onFiltersChange: (filters: ActivityFilters) => void
  onReset: () => void
}

export function AutomationActivityToolbar({
  query = '',
  onQueryChange,
  filters,
  onFiltersChange,
  onReset,
}: AutomationActivityToolbarProps) {
  const isFiltered = Boolean(
    query ||
      filters.status?.length ||
      filters.provider?.length ||
      filters.mode?.length ||
      filters.contentType?.length ||
      filters.outputType?.length,
  )

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2"
      data-testid="activity-toolbar"
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por autor, comentário ou post..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value || undefined)}
          className="h-8 w-44 lg:w-72 text-xs"
          data-testid="activity-search-input"
        />

        <DataTableFacetedFilter
          title="Status"
          options={activityStatusOptions}
          selectedValues={filters.status}
          onValuesChange={(status) => onFiltersChange({ ...filters, status: status as never })}
        />

        <DataTableFacetedFilter
          title="Plataforma"
          options={activityProviderOptions}
          selectedValues={filters.provider}
          onValuesChange={(provider) =>
            onFiltersChange({ ...filters, provider: provider as never })
          }
        />

        <DataTableFacetedFilter
          title="Ambiente"
          options={activityModeOptions}
          selectedValues={filters.mode}
          onValuesChange={(mode) => onFiltersChange({ ...filters, mode: mode as never })}
        />

        <DataTableFacetedFilter
          title="Conteúdo"
          options={activityContentTypeOptions}
          selectedValues={filters.contentType}
          onValuesChange={(contentType) =>
            onFiltersChange({ ...filters, contentType: contentType as never })
          }
        />

        <DataTableFacetedFilter
          title="Ação"
          options={activityOutputTypeOptions}
          selectedValues={filters.outputType}
          onValuesChange={(outputType) =>
            onFiltersChange({ ...filters, outputType: outputType as never })
          }
        />

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={onReset}
            className="h-8 px-2 lg:px-3 text-xs"
            data-testid="activity-reset-filters-button"
          >
            Limpar
            <Cross2Icon className="ms-2 h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
