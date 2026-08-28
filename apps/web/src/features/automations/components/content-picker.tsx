import { useState, useMemo } from 'react'
import type { ContentResponse } from '@engancha/contracts'
import { Check, Film, Image as ImageIcon, Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useSimulatedContents } from '../hooks/use-simulated-contents'
import { CreateSimulatedContentDialog } from './create-simulated-content-dialog'

interface ContentPickerProps {
  workspaceId: string
  value?: string | null
  onChange: (contentId: string | null) => void
  disabled?: boolean
}

export function ContentPicker({
  workspaceId,
  value,
  onChange,
  disabled = false,
}: ContentPickerProps) {
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data, isLoading, isError } = useSimulatedContents(workspaceId)
  const items = data?.items ?? []

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const query = search.toLowerCase()
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.externalContentId.toLowerCase().includes(query),
    )
  }, [items, search])

  const handleSelect = (item: ContentResponse) => {
    if (disabled) return
    if (value === item.id) {
      onChange(null)
    } else {
      onChange(item.id)
    }
  }

  const handleCreated = (createdItem: ContentResponse) => {
    onChange(createdItem.id)
  }

  return (
    <div
      className="space-y-4"
      data-testid="content-picker"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou ID do post..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="content-search-input"
            disabled={disabled || isLoading}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
          disabled={disabled}
          data-testid="open-create-content-dialog-button"
        >
          <Plus className="mr-2 size-4" />
          Novo conteúdo simulado
        </Button>
      </div>

      {isLoading && (
        <div
          className="space-y-2"
          data-testid="content-picker-loading"
        >
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Não foi possível carregar os conteúdos simulados.
        </div>
      )}

      {!isLoading && !isError && filteredItems.length === 0 && (
        <div
          className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center"
          data-testid="content-picker-empty"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ImageIcon className="size-6" />
          </div>
          <h4 className="mt-3 text-sm font-semibold">Nenhum conteúdo simulado encontrado</h4>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            {search.trim()
              ? 'Tente buscar com outro termo ou cadastre um novo conteúdo.'
              : 'Crie seu primeiro conteúdo simulado para associar a esta automação.'}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setIsDialogOpen(true)}
            disabled={disabled}
          >
            <Plus className="mr-2 size-3.5" />
            Criar conteúdo simulado
          </Button>
        </div>
      )}

      {!isLoading && !isError && filteredItems.length > 0 && (
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="content-picker-list"
        >
          {filteredItems.map((item) => {
            const isSelected = value === item.id

            return (
              <button
                key={item.id}
                type="button"
                data-testid={`content-card-${item.id}`}
                onClick={() => handleSelect(item)}
                disabled={disabled}
                className={cn(
                  'group relative flex flex-col justify-between rounded-lg border p-4 text-left transition-all hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-accent/40',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground group-hover:bg-muted/80',
                      )}
                    >
                      {item.contentType === 'VIDEO' ? (
                        <Film className="size-4" />
                      ) : (
                        <ImageIcon className="size-4" />
                      )}
                    </div>
                    <div>
                      <h5 className="line-clamp-1 text-sm font-medium text-foreground">
                        {item.title}
                      </h5>
                      <span className="line-clamp-1 text-xs text-muted-foreground font-mono">
                        {item.externalContentId}
                      </span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30 group-hover:border-muted-foreground',
                    )}
                  >
                    {isSelected && <Check className="size-3 stroke-[3]" />}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-border/50">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 uppercase"
                  >
                    {item.provider}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 uppercase"
                  >
                    {item.mode}
                  </Badge>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <CreateSimulatedContentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        workspaceId={workspaceId}
        onCreated={handleCreated}
      />
    </div>
  )
}
