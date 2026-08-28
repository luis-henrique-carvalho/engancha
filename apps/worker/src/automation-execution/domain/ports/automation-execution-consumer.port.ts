import type { AutomationExecutionRequested } from '@engancha/contracts'

export const AUTOMATION_EXECUTION_CONSUMER = Symbol('AUTOMATION_EXECUTION_CONSUMER')

export interface AutomationExecutionResult {
  executionId: string
  status: 'COMPLETED' | 'IGNORED' | 'FAILED' | 'PENDING' | string
}

export interface AutomationExecutionConsumer {
  consume(message: AutomationExecutionRequested): Promise<AutomationExecutionResult>
}
