import { useState } from 'react'
import type { ContentResponse } from '@engancha/contracts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateSimulatedContent } from '../hooks/use-create-simulated-content'

interface CreateSimulatedContentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onCreated?: (content: ContentResponse) => void
}

export function CreateSimulatedContentDialog({
  open,
  onOpenChange,
  workspaceId,
  onCreated,
}: CreateSimulatedContentDialogProps) {
  const [title, setTitle] = useState('')
  const [externalContentId, setExternalContentId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { createSimulatedContent, isCreating } = useCreateSimulatedContent(workspaceId)

  const handleClose = () => {
    setTitle('')
    setExternalContentId('')
    setError(null)
    onOpenChange(false)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const trimmedTitle = title.trim()
    const trimmedId = externalContentId.trim()

    if (!trimmedTitle) {
      setError('O título do conteúdo é obrigatório.')
      return
    }

    if (!trimmedId) {
      setError('O identificador externo do post é obrigatório.')
      return
    }

    try {
      const created = await createSimulatedContent({
        title: trimmedTitle,
        externalContentId: trimmedId,
        provider: 'INSTAGRAM',
        mode: 'SIMULATED',
        contentType: 'POST',
      })

      handleClose()
      onCreated?.(created)
    } catch {
      // Error handled by mutation hook via toast
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => (!val ? handleClose() : onOpenChange(val))}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Criar conteúdo simulado</DialogTitle>
          <DialogDescription>
            Cadastre uma publicação ou reel simulado para associar e testar sua automação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="simulated-content-title">Título do conteúdo</Label>
            <Input
              id="simulated-content-title"
              data-testid="create-simulated-content-title"
              placeholder="Ex: Foto de Lançamento de Produto"
              value={title}
              maxLength={160}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="simulated-content-external-id">
              Identificador do post (ID ou permalink)
            </Label>
            <Input
              id="simulated-content-external-id"
              data-testid="create-simulated-content-id"
              placeholder="Ex: post_insta_2026_01"
              value={externalContentId}
              maxLength={255}
              onChange={(e) => setExternalContentId(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isCreating}>
              Cancelar
            </Button>
            <Button
              type="submit"
              data-testid="submit-create-simulated-content"
              disabled={isCreating}
            >
              {isCreating ? 'Criando…' : 'Criar conteúdo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
