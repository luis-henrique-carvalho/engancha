import type { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import type { AutomationFinalActionFormValues } from '../data/automation-step-schemas'

export interface FinalActionEmailFieldsProps {
  form: UseFormReturn<AutomationFinalActionFormValues>
  watchedPrompt: string
}

export function FinalActionEmailFields({ form, watchedPrompt }: FinalActionEmailFieldsProps) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <FormField
        control={form.control}
        name="prompt"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Mensagem de solicitação do e-mail</FormLabel>
              <span
                className="text-xs text-muted-foreground"
                data-testid="automation-final-action-prompt-char-count"
              >
                {watchedPrompt.length}/300 caracteres
              </span>
            </div>
            <FormControl>
              <Textarea
                placeholder="Ex: Por favor, digite seu melhor e-mail para receber o material:"
                rows={3}
                data-testid="automation-final-action-prompt-input"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormDescription>
              Texto enviado no Direct para solicitar o endereço de e-mail do seguidor.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
