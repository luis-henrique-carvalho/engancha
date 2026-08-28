import type { AutomationResponse } from '@engancha/contracts'
import { getAutomationReadiness, type AutomationStepId } from '../data/automation-readiness'
import { AutomationReviewChecklist } from './automation-review-checklist'
import { AutomationReviewPublishAlert } from './automation-review-publish-alert'
import { AutomationReviewPublishBar } from './automation-review-publish-bar'
import { AutomationReviewSummary } from './automation-review-summary'

export interface AutomationReviewProps {
  automation: AutomationResponse
  workspaceId?: string
  automationId?: string
  onNavigateStep?: (stepId: AutomationStepId) => void
  onPublish?: () => Promise<void>
  onPause?: () => void
  isPublishing?: boolean
  isPausing?: boolean
  publishIssues?: string[] | null
  publishErrorMessage?: string | null
}

export function AutomationReview({
  automation,
  onNavigateStep,
  onPublish,
  onPause,
  isPublishing = false,
  isPausing = false,
  publishIssues = null,
  publishErrorMessage = null,
}: AutomationReviewProps) {
  const readiness = getAutomationReadiness(automation)

  return (
    <div className="space-y-6">
      <AutomationReviewPublishAlert
        errorMessage={publishErrorMessage}
        issues={publishIssues}
        onNavigateStep={onNavigateStep}
      />

      <AutomationReviewChecklist
        readiness={readiness}
        onNavigateStep={onNavigateStep}
      />

      <AutomationReviewSummary
        automation={automation}
        onNavigateStep={onNavigateStep}
      />

      <AutomationReviewPublishBar
        status={automation.status}
        isReady={readiness.isReady}
        hasUnpublishedChanges={automation.hasUnpublishedChanges}
        isPublishing={isPublishing}
        isPausing={isPausing}
        onPublish={onPublish}
        onPause={onPause}
      />
    </div>
  )
}
