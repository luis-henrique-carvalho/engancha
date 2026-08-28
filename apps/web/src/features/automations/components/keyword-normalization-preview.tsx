import { normalizeAutomationKeyword } from '@engancha/contracts'
import { Sparkles, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface KeywordNormalizationPreviewProps {
  keyword: string
}

export function KeywordNormalizationPreview({ keyword }: KeywordNormalizationPreviewProps) {
  const trimmed = keyword.trim()
  const normalized = trimmed ? normalizeAutomationKeyword(keyword) : ''

  return (
    <div
      className="rounded-lg border bg-muted/40 p-4 space-y-3"
      data-testid="keyword-normalization-preview"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Sparkles className="size-4 text-primary" />
        <span>Prévia da normalização em tempo real</span>
      </div>

      {normalized ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Forma comparada:</span>
            <span
              className="rounded-md bg-background px-2.5 py-1 font-mono text-sm font-semibold text-primary border shadow-xs"
              data-testid="normalized-keyword-text"
            >
              {normalized}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Quando um usuário comentar no seu post, qualquer variação de caixa, acentos ou múltiplos
            espaços será comparada com este valor exato.
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="secondary" className="text-[10px]">
              Sem diferenciação de maiúsculas
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Acentos ignorados
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Espaços unificados
            </Badge>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0 text-muted-foreground" />
          <span>
            Digite uma palavra ou frase acima para visualizar como os comentários serão
            interpretados.
          </span>
        </div>
      )}
    </div>
  )
}
