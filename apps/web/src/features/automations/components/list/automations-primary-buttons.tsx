import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AutomationsPrimaryButtonsProps {
  onCreateClick: () => void
  isCreating?: boolean
}

export function AutomationsPrimaryButtons({
  onCreateClick,
  isCreating,
}: AutomationsPrimaryButtonsProps) {
  return (
    <Button
      onClick={onCreateClick}
      disabled={isCreating}
    >
      <Plus className="mr-2 size-4" />
      {isCreating ? 'Criando rascunho...' : 'Nova automação'}
    </Button>
  )
}
