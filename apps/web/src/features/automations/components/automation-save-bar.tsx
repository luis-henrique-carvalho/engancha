import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AutomationSaveBarProps {
  onSave?: () => void
  isSaving?: boolean
  saveLabel?: string
  onNext?: () => void
  nextLabel?: string
  showNext?: boolean
}

export function AutomationSaveBar({
  onSave,
  isSaving = false,
  saveLabel = 'Salvar etapa',
  onNext,
  nextLabel = 'Próxima etapa',
  showNext = true,
}: AutomationSaveBarProps) {
  return (
    <div className="flex w-full items-center justify-between gap-3 pt-4">
      {onSave ? (
        <Button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          data-testid="automation-save-step-button"
        >
          <Check className="mr-2 size-4" />
          {isSaving ? 'Salvando...' : saveLabel}
        </Button>
      ) : (
        <div />
      )}

      {showNext && onNext && (
        <Button
          type="button"
          variant="outline"
          onClick={onNext}
          data-testid="automation-next-step-button"
        >
          {nextLabel}
          <ArrowRight className="ml-2 size-4" />
        </Button>
      )}
    </div>
  )
}
