import type { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { AutomationFinalActionFormValues } from '../data/automation-step-schemas'

export interface FinalActionLinkFieldsProps {
  form: UseFormReturn<AutomationFinalActionFormValues>
  watchedLabel: string
}

export function FinalActionLinkFields({ form, watchedLabel }: FinalActionLinkFieldsProps) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <FormField
        control={form.control}
        name="url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL de destino</FormLabel>
            <FormControl>
              <Input
                placeholder="https://exemplo.com.br/promocao"
                data-testid="automation-final-action-url-input"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormDescription>
              Endereço web para onde o seguidor será direcionado ao clicar.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="label"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Texto do botão / rótulo (opcional)</FormLabel>
              <span
                className="text-xs text-muted-foreground"
                data-testid="automation-final-action-label-char-count"
              >
                {watchedLabel.length}/80 caracteres
              </span>
            </div>
            <FormControl>
              <Input
                placeholder="Ex: Acessar cupom"
                data-testid="automation-final-action-label-input"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormDescription>
              Texto exibido no botão da mensagem direta (padrão: Abrir link).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
