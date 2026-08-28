import React, { useState } from 'react'
import { Instagram, Play, Send } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface SimulationContentInfo {
  id: string
  externalId: string
  title: string
  type: 'POST' | 'VIDEO'
  thumbnailUrl?: string | null
}

export interface SimulationTestFormProps {
  content: SimulationContentInfo | null
  isSubmitting?: boolean
  onSubmit: (values: { author: string; text: string; commentId?: string }) => Promise<void> | void
}

export function SimulationTestForm({
  content,
  isSubmitting = false,
  onSubmit,
}: SimulationTestFormProps) {
  const [author, setAuthor] = useState('@seguidor.teste')
  const [commentId, setCommentId] = useState('')
  const [text, setText] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const trimmedAuthor = author.trim()
    const trimmedText = text.trim()

    if (!trimmedAuthor) {
      setValidationError('O nome de usuário do autor é obrigatório.')
      return
    }

    if (trimmedAuthor.length > 120) {
      setValidationError('O autor deve ter no máximo 120 caracteres.')
      return
    }

    if (!trimmedText) {
      setValidationError('O texto do comentário é obrigatório.')
      return
    }

    if (trimmedText.length > 1000) {
      setValidationError('O comentário deve ter no máximo 1000 caracteres.')
      return
    }

    try {
      await onSubmit({
        author: trimmedAuthor,
        text: trimmedText,
        commentId: commentId.trim() || undefined,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ocorreu um erro ao enviar o comentário de teste.'
      setValidationError(message)
    }
  }

  return (
    <Card
      className="h-full"
      data-testid="simulation-test-form-card"
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Simular comentário</CardTitle>
          <Badge
            variant="outline"
            className="gap-1 border-primary/30 text-primary"
          >
            <Instagram className="size-3" />
            Instagram
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Envie uma interação simulada para testar as respostas configuradas.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Published Target Content Summary */}
        {content ? (
          <div
            className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3 text-xs"
            data-testid="simulation-target-content"
          >
            {content.thumbnailUrl ? (
              <img
                src={content.thumbnailUrl}
                alt="Miniatura do post"
                className="size-12 rounded object-cover"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded bg-muted text-muted-foreground">
                <Instagram className="size-5" />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">
                  {content.type === 'VIDEO' ? 'Reel / Vídeo' : 'Post publicado'}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  Simulado
                </Badge>
              </div>
              <p className="line-clamp-2 text-muted-foreground">{content.title || 'Sem título'}</p>
            </div>
          </div>
        ) : (
          <Alert
            variant="destructive"
            className="py-2 text-xs"
          >
            <AlertTitle>Conteúdo não vinculado</AlertTitle>
            <AlertDescription>
              Esta automação não possui uma publicação de destino configurada.
            </AlertDescription>
          </Alert>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {validationError && (
            <Alert
              variant="destructive"
              className="py-2 text-xs"
              data-testid="simulation-form-error"
            >
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="sim-author"
              className="text-xs"
            >
              Autor do comentário <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sim-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="@seu_seguidor"
              maxLength={120}
              disabled={isSubmitting}
              className="h-9 text-xs"
              data-testid="simulation-input-author"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="sim-comment-id"
              className="text-xs"
            >
              Identificador do comentário (opcional)
            </Label>
            <Input
              id="sim-comment-id"
              value={commentId}
              onChange={(e) => setCommentId(e.target.value)}
              placeholder="ex: comment_123"
              maxLength={255}
              disabled={isSubmitting}
              className="h-9 text-xs"
              data-testid="simulation-input-comment-id"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="sim-text"
              className="text-xs"
            >
              Comentário na publicação <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="sim-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite o comentário que ativará a automação (ex: Quero o link)..."
              rows={3}
              maxLength={1000}
              disabled={isSubmitting}
              className="resize-none text-xs"
              data-testid="simulation-input-text"
            />
            <p className="text-[11px] text-muted-foreground">
              {text.length}/1000 caracteres. Insira a palavra-chave configurada.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full gap-2 text-xs font-semibold"
            disabled={isSubmitting || !content}
            data-testid="simulation-submit-btn"
          >
            {isSubmitting ? (
              <>
                <Play className="size-3.5 animate-spin" />
                Enviando teste...
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                Testar jornada do seguidor
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
