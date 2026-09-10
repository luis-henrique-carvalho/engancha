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
import {
  AutomationSaveBar,
  AutomationStepSection,
  useOptionalAutomationEditor,
} from '../components'
import { buildUpdatedActions, getPublicReplyText } from '../data/automation-action-mappers'
import {
  automationPublicReplySchema,
  type AutomationPublicReplyFormValues,
} from '../data/automation-step-schemas'
import { useAutomationMutations } from '../hooks/use-automation-mutations'
import { useAutomation } from '../hooks/use-automation'
import { useUnsavedChanges } from '../hooks/use-unsaved-changes'

interface PublicReplyStepViewProps {
  workspaceId?: string
  automationId?: string
  automation?: AutomationResponse
  onNext?: () => void
}

export function PublicReplyStepView({
  workspaceId: propWorkspaceId,
  automationId: propAutomationId,
  automation: propAutomation,
  onNext: propOnNext,
}: PublicReplyStepViewProps = {}) {
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
  const initialText = getPublicReplyText(currentActions)

  const { patchAutomation, isSaving } = useAutomationMutations(workspaceId, automationId)

  const form = useForm<AutomationPublicReplyFormValues>({
    resolver: zodResolver(automationPublicReplySchema),
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

  const onSubmit = async (values: AutomationPublicReplyFormValues) => {
    const updatedActions = buildUpdatedActions(currentActions, {
      publicReply: values.text,
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
      to: '/automations/$automationId/direct-message',
      params: { automationId },
    })
  }

  return (
    <AutomationStepSection
      title="Resposta pública"
      description="Defina o comentário de resposta visível no post."
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Texto do comentário público</FormLabel>
                  <span
                    className="text-xs text-muted-foreground"
                    data-testid="automation-public-reply-char-count"
                  >
                    {watchedText.length}/1000 caracteres
                  </span>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Ex: Obrigado pelo comentário! Enviamos o link no seu direct 🚀"
                    rows={4}
                    data-testid="automation-public-reply-input"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormDescription>
                  Este comentário será publicado automaticamente em resposta aos comentários que
                  acionarem o gatilho.
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
