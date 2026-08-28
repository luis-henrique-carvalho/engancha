import { Link as LinkIcon, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export interface FinalActionTypeSelectorProps {
  selectedType: 'LINK' | 'CAPTURE_EMAIL'
  onSelectType: (type: 'LINK' | 'CAPTURE_EMAIL') => void
}

export function FinalActionTypeSelector({
  selectedType,
  onSelectType,
}: FinalActionTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Tipo de ação final</Label>
      <RadioGroup
        value={selectedType}
        onValueChange={(val) => onSelectType(val as 'LINK' | 'CAPTURE_EMAIL')}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <Label
          htmlFor="final-action-link"
          data-testid="final-action-type-link"
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-colors hover:bg-accent/50',
            selectedType === 'LINK' ? 'border-primary bg-primary/5' : 'border-muted bg-popover',
          )}
        >
          <RadioGroupItem
            value="LINK"
            id="final-action-link"
            className="mt-0.5"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <LinkIcon className="h-4 w-4 text-primary" />
              <span>Link externo</span>
            </div>
            <p className="text-xs font-normal text-muted-foreground">
              Envia um link com botão interativo para direcionar o seguidor.
            </p>
          </div>
        </Label>

        <Label
          htmlFor="final-action-email"
          data-testid="final-action-type-email"
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-colors hover:bg-accent/50',
            selectedType === 'CAPTURE_EMAIL'
              ? 'border-primary bg-primary/5'
              : 'border-muted bg-popover',
          )}
        >
          <RadioGroupItem
            value="CAPTURE_EMAIL"
            id="final-action-email"
            className="mt-0.5"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <Mail className="h-4 w-4 text-primary" />
              <span>Captura de e-mail</span>
            </div>
            <p className="text-xs font-normal text-muted-foreground">
              Solicita o endereço de e-mail para geração de leads.
            </p>
          </div>
        </Label>
      </RadioGroup>
    </div>
  )
}
