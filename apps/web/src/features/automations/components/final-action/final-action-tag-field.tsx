import { Tag as TagIcon, Plus } from 'lucide-react'
import type { TagResponse } from '@engancha/contracts'
import { normalizeTagName } from '@engancha/contracts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface FinalActionTagFieldProps {
  tags: TagResponse[]
  isLoadingTags?: boolean
  tagMode: 'none' | 'existing' | 'new'
  onTagModeChange: (mode: 'none' | 'existing' | 'new') => void
  selectedTagId: string
  onSelectTagId: (tagId: string) => void
  newTagName: string
  onNewTagNameChange: (name: string) => void
}

export function FinalActionTagField({
  tags,
  isLoadingTags,
  tagMode,
  onTagModeChange,
  selectedTagId,
  onSelectTagId,
  newTagName,
  onNewTagNameChange,
}: FinalActionTagFieldProps) {
  const normalizedPreview = newTagName.trim() ? normalizeTagName(newTagName) : ''

  return (
    <div
      className="space-y-4 rounded-lg border p-4"
      data-testid="automation-final-action-tag-section"
    >
      <div className="flex items-center gap-2">
        <TagIcon className="h-4 w-4 text-primary shrink-0" />
        <div>
          <Label className="text-sm font-semibold">Tag do contato (opcional)</Label>
          <p className="text-xs text-muted-foreground">
            Associe uma tag para segmentar o contato quando esta automação for executada.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          data-testid="tag-mode-none"
          onClick={() => onTagModeChange('none')}
          className={`flex flex-col items-start justify-between rounded-md border p-3 text-left transition-colors ${
            tagMode === 'none'
              ? 'border-primary bg-primary/5 text-foreground'
              : 'border-border text-muted-foreground hover:bg-accent/50'
          }`}
        >
          <span className="text-xs font-semibold">Sem tag</span>
          <span className="text-[11px] text-muted-foreground">Não categorizar o contato</span>
        </button>

        <button
          type="button"
          data-testid="tag-mode-existing"
          onClick={() => onTagModeChange('existing')}
          className={`flex flex-col items-start justify-between rounded-md border p-3 text-left transition-colors ${
            tagMode === 'existing'
              ? 'border-primary bg-primary/5 text-foreground'
              : 'border-border text-muted-foreground hover:bg-accent/50'
          }`}
        >
          <span className="text-xs font-semibold">Tag existente</span>
          <span className="text-[11px] text-muted-foreground">
            {tags.length > 0 ? `${tags.length} tag(s) disponível(is)` : 'Selecionar do workspace'}
          </span>
        </button>

        <button
          type="button"
          data-testid="tag-mode-new"
          onClick={() => onTagModeChange('new')}
          className={`flex flex-col items-start justify-between rounded-md border p-3 text-left transition-colors ${
            tagMode === 'new'
              ? 'border-primary bg-primary/5 text-foreground'
              : 'border-border text-muted-foreground hover:bg-accent/50'
          }`}
        >
          <span className="text-xs font-semibold flex items-center gap-1">
            <Plus className="h-3 w-3" /> Criar nova tag
          </span>
          <span className="text-[11px] text-muted-foreground">Adicionar tag inline</span>
        </button>
      </div>

      {tagMode === 'existing' && (
        <div
          className="space-y-2 pt-1"
          data-testid="existing-tag-selector"
        >
          <Label className="text-xs font-medium">Selecione uma tag</Label>
          {isLoadingTags ? (
            <p className="text-xs text-muted-foreground">Carregando tags...</p>
          ) : tags.length === 0 ? (
            <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
              Nenhuma tag encontrada no workspace.{' '}
              <button
                type="button"
                className="text-primary underline hover:opacity-80"
                onClick={() => onTagModeChange('new')}
              >
                Criar uma nova tag
              </button>
            </div>
          ) : (
            <Select
              value={selectedTagId}
              onValueChange={onSelectTagId}
            >
              <SelectTrigger data-testid="automation-tag-select">
                <SelectValue placeholder="Escolha uma tag..." />
              </SelectTrigger>
              <SelectContent>
                {tags.map((tag) => (
                  <SelectItem
                    key={tag.id}
                    value={tag.id}
                    data-testid={`tag-option-${tag.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="font-mono text-[11px]"
                      >
                        #{tag.name}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {tagMode === 'new' && (
        <div
          className="space-y-2 pt-1"
          data-testid="new-tag-input-container"
        >
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Nome da nova tag</Label>
            <span className="text-[11px] text-muted-foreground">
              {newTagName.length}/50 caracteres
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
              #
            </span>
            <Input
              value={newTagName}
              onChange={(e) => onNewTagNameChange(e.target.value.slice(0, 50))}
              placeholder="ex: cliente-vip"
              className="pl-7 font-mono text-sm"
              data-testid="automation-new-tag-input"
            />
          </div>
          {normalizedPreview && (
            <p
              className="text-[11px] text-muted-foreground"
              data-testid="normalized-tag-preview"
            >
              Identificador normalizado:{' '}
              <span className="font-mono font-medium text-foreground">{normalizedPreview}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
