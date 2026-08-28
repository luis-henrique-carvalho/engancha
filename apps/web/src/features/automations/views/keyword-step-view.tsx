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
  KeywordNormalizationPreview,
  useOptionalAutomationEditor,
} from '../components'
import {
  automationKeywordSchema,
  type AutomationKeywordFormValues,
} from '../data/automation-step-schemas'
import { useAutomationMutations } from '../hooks/use-automation-mutations'
import { useAutomation } from '../hooks/use-automation'
import { useUnsavedChanges } from '../hooks/use-unsaved-changes'

interface KeywordStepViewProps {
  workspaceId?: string
  automationId?: string
  automation?: AutomationResponse
  onNext?: () => void
}

export function KeywordStepView({
  workspaceId: propWorkspaceId,
  automationId: propAutomationId,
  automation: propAutomation,
  onNext: propOnNext,
}: KeywordStepViewProps = {}) {
  const context = useOptionalAutomationEditor()
  const navigate = useNavigate()

  const workspaceId = propWorkspaceId ?? context?.workspaceId ?? ''
  const automationId = propAutomationId ?? context?.automationId ?? ''

  const { data: fetchedAutomation } = useAutomation(
    propAutomation ? '' : workspaceId,
    propAutomation ? '' : automationId,
  )

  const activeAutomation = propAutomation ?? context?.automation ?? fetchedAutomation
  const currentKeyword = activeAutomation?.current?.keyword ?? ''

  const { patchAutomation, isSaving } = useAutomationMutations(workspaceId, automationId)

  const form = useForm<AutomationKeywordFormValues>({
    resolver: zodResolver(automationKeywordSchema),
    values: {
      keyword: currentKeyword,
    },
    defaultValues: {
      keyword: currentKeyword,
    },
  })

  const watchedKeyword = form.watch('keyword') ?? ''

  const { UnsavedChangesDialog } = useUnsavedChanges({
    isDirty: form.formState.isDirty,
  })

  const onSubmit = async (values: AutomationKeywordFormValues) => {
    const trimmed = values.keyword?.trim()
    await patchAutomation({
      keyword: trimmed ? trimmed : null,
    })
    form.reset(values)
  }

  const handleNext = () => {
    if (propOnNext) {
      propOnNext()
      return
    }

    void navigate({
      to: '/automations/$automationId/public-reply',
      params: { automationId },
    })
  }

  return (
    <AutomationStepSection
      title="Palavra-chave"
      description="Configure o gatilho textual que aciona a resposta."
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="keyword"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Palavra ou frase de gatilho</FormLabel>
                  <span
                    className="text-xs text-muted-foreground"
                    data-testid="automation-keyword-char-count"
                  >
                    {watchedKeyword.length}/120 caracteres
                  </span>
                </div>
                <FormControl>
                  <Input
                    placeholder="Ex: QUERO ou #PROMOÇÃO"
                    data-testid="automation-keyword-input"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormDescription>
                  Digite a palavra ou frase que o seguidor deve comentar no post para disparar a
                  automação.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <KeywordNormalizationPreview keyword={watchedKeyword} />

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
