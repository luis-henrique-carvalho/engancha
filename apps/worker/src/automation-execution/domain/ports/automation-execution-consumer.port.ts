import type { AutomationExecutionRequested } from '@engancha/contracts'

export const AUTOMATION_EXECUTION_CONSUMER = Symbol('AUTOMATION_EXECUTION_CONSUMER')

export interface AutomationExecutionResult {
  executionId: string
  status: 'COMPLETED' | 'IGNORED' | 'FAILED' | 'PENDING' | 'PROCESSING' | 'SKIPPED' | string
  matched?: boolean
  automationId?: string
  revisionId?: string
  errorCode?: string
}

export interface AutomationExecutionConsumer {
  consume(message: AutomationExecutionRequested): Promise<AutomationExecutionResult>
  handleJobFailure?(params: {
    executionId: string
    organizationId: string
    attemptsMade: number
    maxAttempts: number
    error: Error
  }): Promise<void>
}
