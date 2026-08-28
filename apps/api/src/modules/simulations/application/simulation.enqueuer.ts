import { BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { Queue } from 'bullmq'
import {
  QUEUE_NAMES,
  automationExecutionJobSchema,
  type AutomationExecutionJob,
} from '@engancha/contracts'

export async function enqueueAutomationExecutionJob(
  queue: Pick<Queue<AutomationExecutionJob>, 'add'>,
  input: unknown,
): Promise<void> {
  const parsed = automationExecutionJobSchema.safeParse(input)
  if (!parsed.success) throw new BadRequestException('Invalid automation execution job')

  try {
    await queue.add(QUEUE_NAMES.automationExecution, parsed.data, {
      jobId: parsed.data.executionId,
    })
  } catch {
    throw new ServiceUnavailableException('Automation execution queue unavailable')
  }
}
