import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import type { AutomationResponse } from '@engancha/contracts'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { AutomationSaveBar } from '../components/automation-save-bar'
import { AutomationStepSection } from '../components/automation-step-section'
import { ContentPicker } from '../components/content-picker'
import { useOptionalAutomationEditor } from '../components/automation-editor-provider'
import {
  automationContentSchema,
  type AutomationContentFormValues,
} from '../data/automation-step-schemas'
import { useAutomationMutations } from '../hooks/use-automation-mutations'
import { useAutomation } from '../hooks/use-automation'
import { useUnsavedChanges } from '../hooks/use-unsaved-changes'

interface ContentStepViewProps {
  workspaceId?: string
  automationId?: string
  automation?: AutomationResponse
  onNext?: () => void
}

export function ContentStepView({
  workspaceId: propWorkspaceId,
  automationId: propAutomationId,
  automation: propAutomation,
  onNext: propOnNext,
}: ContentStepViewProps = {}) {
  const context = useOptionalAutomationEditor()
  const navigate = useNavigate()

  const workspaceId = propWorkspaceId ?? context?.workspaceId ?? ''
  const automationId = propAutomationId ?? context?.automationId ?? ''

  const { data: fetchedAutomation } = useAutomation(
    propAutomation ? '' : workspaceId,
    propAutomation ? '' : automationId,
  )

  const activeAutomation = propAutomation ?? context?.automation ?? fetchedAutomation
  const currentTargetId = activeAutomation?.current?.target?.id ?? ''

  const { patchAutomation, isSaving } = useAutomationMutations(workspaceId, automationId)

  const form = useForm<AutomationContentFormValues>({
    resolver: zodResolver(automationContentSchema),
    values: {
      targetId: currentTargetId,
    },
    resetOptions: {
      keepDirtyValues: true,
    },
    defaultValues: {
      targetId: currentTargetId,
    },
  })

  const { UnsavedChangesDialog } = useUnsavedChanges({
    isDirty: form.formState.isDirty,
  })

  const onSubmit = async (values: AutomationContentFormValues) => {
    const targetId = values.targetId?.trim()
    await patchAutomation({
      targetId: targetId ? targetId : null,
    })
    form.reset(values)
  }

  const handleNext = () => {
    if (propOnNext) {
      propOnNext()
      return
    }

    void navigate({
      to: '/automations/$automationId/keyword',
      params: { automationId },
    })
  }

  return (
    <AutomationStepSection
      title="Conteúdo"
      description="Selecione a publicação ou reel do Instagram associado."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="targetId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ContentPicker
                    workspaceId={workspaceId}
                    value={field.value ?? null}
                    onChange={field.onChange}
                  />
                </FormControl>
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
