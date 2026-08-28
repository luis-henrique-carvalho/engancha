import type { AutomationExecutionRequested } from '@engancha/contracts'

export const AUTOMATION_EXECUTION_DISPATCHER = Symbol('AUTOMATION_EXECUTION_DISPATCHER')

export interface AutomationExecutionDispatcher {
  dispatch(message: AutomationExecutionRequested): Promise<void>
}
