import type { AutomationSnapshot } from '@engancha/contracts'

export const AUTOMATION_EXECUTION_REPOSITORY = Symbol('AUTOMATION_EXECUTION_REPOSITORY')

export interface ClaimedExecution {
  id: string
  organizationId: string
  contentId: string
  provider: 'INSTAGRAM' | 'TIKTOK'
  mode: 'SIMULATED' | 'REAL'
  inputText: string
  inputAuthor: string
  commentId: string | null
  originAutomationId: string | null
  automationId: string | null
  automationRevisionId: string | null
  automationSnapshot: AutomationSnapshot | null
  status: string
  attempts: number
  stateVersion: number
}

export interface CandidateAutomation {
  id: string
  organizationId: string
  status: string
  currentPublishedRevision: {
    id: string
    version: number
    target: {
      id: string
      contentId: string
    }
    trigger: {
      id: string
      type: string
      keyword: string
      keywordNormalized: string
    }
    actions: Array<{
      id: string
      position: number
      type: string
      config: Record<string, unknown>
    }>
  }
}

export interface AutomationExecutionOutputDraft {
  key: string
  position: number
  type: 'PUBLIC_REPLY' | 'PRIVATE_REPLY' | 'LINK_DELIVERY' | 'EMAIL_CAPTURE_REQUEST'
  payload: Record<string, unknown>
}

export interface AutomationExecutionRepository {
  claimExecution(executionId: string, organizationId: string): Promise<ClaimedExecution | null>
  findActiveCandidateAutomations(
    organizationId: string,
    contentId: string,
    provider: string,
    mode: string,
  ): Promise<CandidateAutomation[]>
  saveMatchSnapshot(params: {
    executionId: string
    organizationId: string
    automationId: string
    revisionId: string
    snapshot: AutomationSnapshot
  }): Promise<void>
  saveExecutionCompleted(params: {
    executionId: string
    organizationId: string
    automationId: string
    revisionId: string
    snapshot: AutomationSnapshot
    outputs: AutomationExecutionOutputDraft[]
  }): Promise<void>
  recordAttemptFailure(params: {
    executionId: string
    organizationId: string
    attemptsMade: number
  }): Promise<void>
  markIgnored(params: {
    executionId: string
    organizationId: string
    reason: string
  }): Promise<void>
  markFailed(params: {
    executionId: string
    organizationId: string
    errorCode: string
    errorMessage: string
    matched?: boolean
  }): Promise<void>
}
