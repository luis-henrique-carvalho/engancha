import { Injectable } from '@nestjs/common'
import type { AutomationExecutionRequested } from '@engancha/contracts'
import type {
  AutomationExecutionConsumer,
  AutomationExecutionResult,
} from '../domain/ports/automation-execution-consumer.port'

@Injectable()
export class AutomationExecutionService implements AutomationExecutionConsumer {
  async consume(message: AutomationExecutionRequested): Promise<AutomationExecutionResult> {
    return {
      executionId: message.executionId,
      status: 'HANDLED',
    }
  }
}
