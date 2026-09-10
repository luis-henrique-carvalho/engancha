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
import { Input } from '@/components/ui/input'
import {
  AutomationSaveBar,
  AutomationStepSection,
  useOptionalAutomationEditor,
} from '../components'
import {
  automationIdentificationSchema,
  type AutomationIdentificationFormValues,
} from '../data/automation-step-schemas'
import { useAutomationMutations } from '../hooks/use-automation-mutations'
import { useAutomation } from '../hooks/use-automation'
import { useUnsavedChanges } from '../hooks/use-unsaved-changes'

interface IdentificationStepViewProps {
  workspaceId?: string
  automationId?: string
  automation?: AutomationResponse
  onNext?: () => void
}

export function IdentificationStepView({
  workspaceId: propWorkspaceId,
  automationId: propAutomationId,
  automation: propAutomation,
  onNext: propOnNext,
}: IdentificationStepViewProps = {}) {
  const context = useOptionalAutomationEditor()
  const navigate = useNavigate()

  const workspaceId = propWorkspaceId ?? context?.workspaceId ?? ''
  const automationId = propAutomationId ?? context?.automationId ?? ''

  const { data: fetchedAutomation } = useAutomation(
    propAutomation ? '' : workspaceId,
    propAutomation ? '' : automationId,
  )

  const activeAutomation = propAutomation ?? context?.automation ?? fetchedAutomation
  const currentName = activeAutomation?.current?.name ?? ''

  const { patchAutomation, isSaving } = useAutomationMutations(workspaceId, automationId)

  const form = useForm<AutomationIdentificationFormValues>({
    resolver: zodResolver(automationIdentificationSchema),
    values: {
      name: currentName,
    },
    defaultValues: {
      name: currentName,
    },
  })

  const watchedName = form.watch('name') ?? ''

  const { UnsavedChangesDialog } = useUnsavedChanges({
    isDirty: form.formState.isDirty,
  })

  const onSubmit = async (values: AutomationIdentificationFormValues) => {
    const trimmed = values.name?.trim()
    await patchAutomation({
      name: trimmed ? trimmed : null,
    })
    form.reset(values)
  }

  const handleNext = () => {
    if (propOnNext) {
      propOnNext()
      return
    }

    void navigate({
      to: '/automations/$automationId/content',
      params: { automationId },
    })
  }

  return (
    <AutomationStepSection
      title="Identificação"
      description="Defina o nome da automação para organização interna."
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Nome da automação</FormLabel>
                  <span
                    className="text-xs text-muted-foreground"
                    data-testid="automation-name-char-count"
                  >
                    {watchedName.length}/80 caracteres
                  </span>
                </div>
                <FormControl>
                  <Input
                    placeholder="Ex: Black Friday - Comentários no Post"
                    data-testid="automation-name-input"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormDescription>
                  Defina um nome amigável para identificar e organizar esta automação no painel.
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
