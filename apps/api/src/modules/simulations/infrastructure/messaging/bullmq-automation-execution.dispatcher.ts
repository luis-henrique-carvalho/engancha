import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { Queue } from 'bullmq'
import {
  AUTOMATION_EXECUTION_REQUESTED,
  QUEUE_NAMES,
  automationExecutionRequestedSchema,
  type AutomationExecutionRequested,
} from '@engancha/contracts'
import type { AutomationExecutionDispatcher } from '../../domain/ports/automation-execution-dispatcher.port'

@Injectable()
export class BullMqAutomationExecutionDispatcher implements AutomationExecutionDispatcher {
  constructor(
    @InjectQueue(QUEUE_NAMES.automationExecution)
    private readonly queue: Queue<AutomationExecutionRequested>,
  ) {}

  async dispatch(message: AutomationExecutionRequested): Promise<void> {
    const parsed = automationExecutionRequestedSchema.safeParse(message)
    if (!parsed.success)
      throw new ServiceUnavailableException('Automation execution dispatch unavailable')

    try {
      await this.queue.add(AUTOMATION_EXECUTION_REQUESTED, parsed.data, {
        jobId: parsed.data.executionId,
      })
    } catch {
      throw new ServiceUnavailableException('Automation execution dispatch unavailable')
    }
  }
}
