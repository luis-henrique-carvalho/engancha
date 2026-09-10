import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import type { AutomationResponse } from '@engancha/contracts'
import { Form } from '@/components/ui/form'
import {
  AutomationSaveBar,
  AutomationStepSection,
  useOptionalAutomationEditor,
  FinalActionEmailFields,
  FinalActionLinkFields,
  FinalActionTagField,
  FinalActionTypeSelector,
} from '../components'
import {
  buildUpdatedActions,
  getFinalAction,
  getTagAction,
  type FinalAutomationAction,
  type TagAutomationAction,
} from '../data/automation-action-mappers'

import {
  automationFinalActionSchema,
  type AutomationFinalActionFormValues,
} from '../data/automation-step-schemas'
import { useAutomationMutations } from '../hooks/use-automation-mutations'
import { useAutomation } from '../hooks/use-automation'
import { useTags } from '../hooks/use-tags'
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
  const initialTagAction = getTagAction(currentActions)

  const initialActionType: 'LINK' | 'CAPTURE_EMAIL' =
    initialFinalAction?.type === 'CAPTURE_EMAIL' ? 'CAPTURE_EMAIL' : 'LINK'

  const initialTagMode: 'none' | 'existing' | 'new' = initialTagAction
    ? initialTagAction.tagId
      ? 'existing'
      : initialTagAction.name
        ? 'new'
        : 'none'
    : 'none'

  const [selectedType, setSelectedType] = useState<'LINK' | 'CAPTURE_EMAIL'>(initialActionType)
  const [tagMode, setTagMode] = useState<'none' | 'existing' | 'new'>(initialTagMode)
  const [selectedTagId, setSelectedTagId] = useState<string>(initialTagAction?.tagId ?? '')
  const [newTagName, setNewTagName] = useState<string>(initialTagAction?.name ?? '')

  const { tags, isLoading: isLoadingTags } = useTags(workspaceId)
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

  const isTagDirty =
    tagMode !== initialTagMode ||
    (tagMode === 'existing' && selectedTagId !== (initialTagAction?.tagId ?? '')) ||
    (tagMode === 'new' && newTagName !== (initialTagAction?.name ?? ''))

  const { UnsavedChangesDialog } = useUnsavedChanges({
    isDirty: form.formState.isDirty || isTagDirty,
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

    let tagAction: TagAutomationAction | null = null
    if (tagMode === 'existing' && selectedTagId) {
      tagAction = { type: 'APPLY_TAG', tagId: selectedTagId }
    } else if (tagMode === 'new' && newTagName.trim()) {
      tagAction = { type: 'APPLY_TAG', name: newTagName.trim() }
    }

    const updatedActions = buildUpdatedActions(currentActions, {
      finalAction,
      tagAction,
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

          <FinalActionTagField
            tags={tags}
            isLoadingTags={isLoadingTags}
            tagMode={tagMode}
            onTagModeChange={setTagMode}
            selectedTagId={selectedTagId}
            onSelectTagId={setSelectedTagId}
            newTagName={newTagName}
            onNewTagNameChange={setNewTagName}
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
