import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import type { AutomationResponse } from '@engancha/contracts'
import { Link as LinkIcon, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { AutomationSaveBar } from '../components/automation-save-bar'
import { AutomationStepSection } from '../components/automation-step-section'
import { useOptionalAutomationEditor } from '../components/automation-editor-provider'
import {
  buildUpdatedActions,
  getFinalAction,
  type FinalAutomationAction,
} from '../data/automation-action-mappers'

import {
  automationFinalActionSchema,
  type AutomationFinalActionFormValues,
} from '../data/automation-step-schemas'
import { useAutomationMutations } from '../hooks/use-automation-mutations'
import { useAutomation } from '../hooks/use-automation'
import { useUnsavedChanges } from '../hooks/use-unsaved-changes'

interface FinalActionStepViewProps {
  workspaceId?: string
  automationId?: string
  automation?: AutomationResponse
  onNext?: () => void
}

export function FinalActionStepView({
  workspaceId: propWorkspaceId,
  automationId: propAutomationId,
  automation: propAutomation,
  onNext: propOnNext,
}: FinalActionStepViewProps = {}) {
  const context = useOptionalAutomationEditor()
  const navigate = useNavigate()

  const workspaceId = propWorkspaceId ?? context?.workspaceId ?? ''
  const automationId = propAutomationId ?? context?.automationId ?? ''

  const { data: fetchedAutomation } = useAutomation(
    propAutomation ? '' : workspaceId,
    propAutomation ? '' : automationId,
  )

  const activeAutomation = propAutomation ?? context?.automation ?? fetchedAutomation
  const currentActions = activeAutomation?.current?.actions ?? []
  const initialFinalAction = getFinalAction(currentActions)

  const initialActionType: 'LINK' | 'CAPTURE_EMAIL' =
    initialFinalAction?.type === 'CAPTURE_EMAIL' ? 'CAPTURE_EMAIL' : 'LINK'

  const [selectedType, setSelectedType] = useState<'LINK' | 'CAPTURE_EMAIL'>(initialActionType)
  const { patchAutomation, isSaving } = useAutomationMutations(workspaceId, automationId)

  const form = useForm<AutomationFinalActionFormValues>({
    resolver: zodResolver(automationFinalActionSchema),
    values:
      selectedType === 'LINK'
        ? {
            actionType: 'LINK',
            url: initialFinalAction?.type === 'LINK' ? initialFinalAction.url : '',
            label: initialFinalAction?.type === 'LINK' ? initialFinalAction.label : 'Abrir link',
          }
        : {
            actionType: 'CAPTURE_EMAIL',
            prompt: initialFinalAction?.type === 'CAPTURE_EMAIL' ? initialFinalAction.prompt : '',
          },
    defaultValues:
      initialActionType === 'LINK'
        ? {
            actionType: 'LINK',
            url: initialFinalAction?.type === 'LINK' ? initialFinalAction.url : '',
            label: initialFinalAction?.type === 'LINK' ? initialFinalAction.label : 'Abrir link',
          }
        : {
            actionType: 'CAPTURE_EMAIL',
            prompt: initialFinalAction?.type === 'CAPTURE_EMAIL' ? initialFinalAction.prompt : '',
          },
  })

  const watchedValues = form.watch()
  const watchedPrompt =
    watchedValues.actionType === 'CAPTURE_EMAIL' ? (watchedValues.prompt ?? '') : ''
  const watchedLabel = watchedValues.actionType === 'LINK' ? (watchedValues.label ?? '') : ''

  const { UnsavedChangesDialog } = useUnsavedChanges({
    isDirty: form.formState.isDirty,
  })

  const handleModeChange = (newType: 'LINK' | 'CAPTURE_EMAIL') => {
    setSelectedType(newType)
    if (newType === 'LINK') {
      form.setValue('actionType', 'LINK')
      form.setValue('url', initialFinalAction?.type === 'LINK' ? initialFinalAction.url : '')
      form.setValue(
        'label',
        initialFinalAction?.type === 'LINK' ? initialFinalAction.label : 'Abrir link',
      )
    } else {
      form.setValue('actionType', 'CAPTURE_EMAIL')
      form.setValue(
        'prompt',
        initialFinalAction?.type === 'CAPTURE_EMAIL' ? initialFinalAction.prompt : '',
      )
    }
  }

  const onSubmit = async (values: AutomationFinalActionFormValues) => {
    let finalAction: FinalAutomationAction | null = null

    if (values.actionType === 'LINK') {
      const trimmedUrl = values.url?.trim()
      if (trimmedUrl) {
        finalAction = {
          type: 'LINK',
          url: trimmedUrl,
          label: values.label?.trim() || 'Abrir link',
        }
      }
    } else if (values.actionType === 'CAPTURE_EMAIL') {
      const trimmedPrompt = values.prompt?.trim()
      if (trimmedPrompt) {
        finalAction = {
          type: 'CAPTURE_EMAIL',
          prompt: trimmedPrompt,
        }
      }
    }

    const updatedActions = buildUpdatedActions(currentActions, {
      finalAction,
    })

    await patchAutomation({
      actions: updatedActions,
    })
    form.reset(values)
  }

  const handleNext = () => {
    if (propOnNext) {
      propOnNext()
      return
    }

    void navigate({
      to: '/automations/$automationId/review',
      params: { automationId },
    })
  }

  return (
    <AutomationStepSection
      title="Ação final"
      description="Configure o link de destino ou captura de e-mail."
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <FinalActionTypeSelector
            selectedType={selectedType}
            onSelectType={handleModeChange}
          />

          {selectedType === 'LINK' && (
            <FinalActionLinkFields
              form={form}
              watchedLabel={watchedLabel}
            />
          )}

          {selectedType === 'CAPTURE_EMAIL' && (
            <FinalActionEmailFields
              form={form}
              watchedPrompt={watchedPrompt}
            />
          )}

          <AutomationSaveBar
            onSave={form.handleSubmit(onSubmit)}
            isSaving={isSaving}
            saveLabel="Salvar etapa"
            onNext={handleNext}
            nextLabel="Próxima etapa"
            showNext={true}
          />
        </form>
      </Form>
      <UnsavedChangesDialog />
    </AutomationStepSection>
  )
}

function FinalActionTypeSelector({
  selectedType,
  onSelectType,
}: {
  selectedType: 'LINK' | 'CAPTURE_EMAIL'
  onSelectType: (type: 'LINK' | 'CAPTURE_EMAIL') => void
}) {
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
            <p className="text-xs text-muted-foreground font-normal">
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
            <p className="text-xs text-muted-foreground font-normal">
              Solicita o endereço de e-mail para geração de leads.
            </p>
          </div>
        </Label>
      </RadioGroup>
    </div>
  )
}

function FinalActionLinkFields({
  form,
  watchedLabel,
}: {
  form: import('react-hook-form').UseFormReturn<AutomationFinalActionFormValues>
  watchedLabel: string
}) {
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

function FinalActionEmailFields({
  form,
  watchedPrompt,
}: {
  form: import('react-hook-form').UseFormReturn<AutomationFinalActionFormValues>
  watchedPrompt: string
}) {
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
