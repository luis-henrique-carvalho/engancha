import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import type { AutomationResponse } from '@engancha/contracts'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { AutomationSaveBar } from '../components/automation-save-bar'
import { AutomationStepSection } from '../components/automation-step-section'
import { useOptionalAutomationEditor } from '../components/automation-editor-provider'
import { buildUpdatedActions, getPrivateReplyText } from '../data/automation-action-mappers'
import {
  automationDirectMessageSchema,
  type AutomationDirectMessageFormValues,
} from '../data/automation-step-schemas'
import { useAutomationMutations } from '../hooks/use-automation-mutations'
import { useAutomation } from '../hooks/use-automation'
import { useUnsavedChanges } from '../hooks/use-unsaved-changes'

interface DirectMessageStepViewProps {
  workspaceId?: string
  automationId?: string
  automation?: AutomationResponse
  onNext?: () => void
}

export function DirectMessageStepView({
  workspaceId: propWorkspaceId,
  automationId: propAutomationId,
  automation: propAutomation,
  onNext: propOnNext,
}: DirectMessageStepViewProps = {}) {
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
  const initialText = getPrivateReplyText(currentActions)

  const { patchAutomation, isSaving } = useAutomationMutations(workspaceId, automationId)

  const form = useForm<AutomationDirectMessageFormValues>({
    resolver: zodResolver(automationDirectMessageSchema),
    values: {
      text: initialText,
    },
    defaultValues: {
      text: initialText,
    },
  })

  const watchedText = form.watch('text') ?? ''

  const { UnsavedChangesDialog } = useUnsavedChanges({
    isDirty: form.formState.isDirty,
  })

  const onSubmit = async (values: AutomationDirectMessageFormValues) => {
    const updatedActions = buildUpdatedActions(currentActions, {
      privateReply: values.text,
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
      to: '/automations/$automationId/final-action',
      params: { automationId },
    })
  }

  return (
    <AutomationStepSection
      title="Mensagem direta (DM)"
      description="Defina o texto enviado diretamente no direct."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Texto da mensagem privada (DM)</FormLabel>
                  <span
                    className="text-xs text-muted-foreground"
                    data-testid="automation-direct-message-char-count"
                  >
                    {watchedText.length}/1000 caracteres
                  </span>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Ex: Olá! Aqui está o seu acesso exclusivo:"
                    rows={4}
                    data-testid="automation-direct-message-input"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormDescription>
                  Esta mensagem será enviada no Direct do Instagram para o usuário que interagir com
                  a publicação.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
