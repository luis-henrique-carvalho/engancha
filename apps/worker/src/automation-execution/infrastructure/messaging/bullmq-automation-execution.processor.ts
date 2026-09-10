import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Injectable } from '@nestjs/common'
import { Job, UnrecoverableError } from 'bullmq'
import { QUEUE_NAMES, automationExecutionRequestedSchema } from '@engancha/contracts'
import { WORKER_LOGGER } from '../../../common/worker-logger.token'
import type { EventLogger } from '../../../common/runtime-lifecycle.service'
import {
  AUTOMATION_EXECUTION_CONSUMER,
  type AutomationExecutionConsumer,
  type AutomationExecutionResult,
} from '../../domain/ports/automation-execution-consumer.port'

@Injectable()
@Processor(QUEUE_NAMES.automationExecution, { concurrency: 2 })
export class BullMqAutomationExecutionProcessor extends WorkerHost {
  constructor(
    @Inject(WORKER_LOGGER) private readonly logger: EventLogger,
    @Inject(AUTOMATION_EXECUTION_CONSUMER)
    private readonly consumer: AutomationExecutionConsumer,
  ) {
    super()
  }

  async process(job: Job<unknown>): Promise<AutomationExecutionResult> {
    const parsed = automationExecutionRequestedSchema.safeParse(job.data)
    const correlationId =
      parsed.success && parsed.data.correlationId ? parsed.data.correlationId : 'unknown'
    const executionId =
      parsed.success && parsed.data.executionId ? parsed.data.executionId : 'unknown'

    this.logger.event('automation_execution_job_received', {
      jobId: String(job.id),
      correlationId,
      executionId,
    })

    if (!parsed.success) {
      this.logger.event('automation_execution_job_rejected', {
        jobId: String(job.id),
        correlationId,
        reason: 'Invalid schema payload',
      })
      throw new UnrecoverableError('Invalid automation execution job payload')
    }

    const result = await this.consumer.consume(parsed.data)

    this.logger.event('automation_execution_job_completed', {
      jobId: String(job.id),
      correlationId,
      executionId: result.executionId,
      status: result.status,
    })

    return result
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<unknown> | undefined, error: Error): Promise<void> {
    const attemptsMade = job?.attemptsMade ?? 0
    const attempts = job?.opts.attempts ?? 1
    const parsed = automationExecutionRequestedSchema.safeParse(job?.data)
    const correlationId =
      parsed.success && parsed.data.correlationId ? parsed.data.correlationId : 'unknown'
    const executionId =
      parsed.success && parsed.data.executionId ? parsed.data.executionId : 'unknown'

    this.logger.event(
      attemptsMade < attempts
        ? 'automation_execution_job_retry'
        : 'automation_execution_job_failed_definitive',
      {
        jobId: job ? String(job.id) : 'unknown',
        correlationId,
        executionId,
        attemptsMade,
        attempts,
        reason: error.name || error.message,
      },
    )

    if (parsed.success && this.consumer.handleJobFailure) {
      try {
        await this.consumer.handleJobFailure({
          executionId: parsed.data.executionId,
          organizationId: parsed.data.organizationId,
          attemptsMade,
          maxAttempts: attempts,
          error,
        })
      } catch (handlingError) {
        this.logger.event('automation_execution_job_failure_handler_error', {
          jobId: job ? String(job.id) : 'unknown',
          correlationId,
          executionId,
          reason: (handlingError as Error)?.message ?? 'Unknown error',
        })
      }
    }
  }
}
