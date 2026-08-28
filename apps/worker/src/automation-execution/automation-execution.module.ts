import { Module } from '@nestjs/common'
import { BullMqAutomationExecutionProcessor } from './infrastructure/messaging/bullmq-automation-execution.processor'
import { AUTOMATION_EXECUTION_CONSUMER } from './domain/ports/automation-execution-consumer.port'
import { AUTOMATION_EXECUTION_REPOSITORY } from './domain/ports/automation-execution-repository.port'
import { AutomationExecutionService } from './application/automation-execution.service'
import { PrismaAutomationExecutionRepository } from './infrastructure/persistence/prisma-automation-execution.repository'

@Module({
  providers: [
    AutomationExecutionService,
    {
      provide: AUTOMATION_EXECUTION_CONSUMER,
      useExisting: AutomationExecutionService,
    },
    PrismaAutomationExecutionRepository,
    {
      provide: AUTOMATION_EXECUTION_REPOSITORY,
      useExisting: PrismaAutomationExecutionRepository,
    },
    BullMqAutomationExecutionProcessor,
  ],
  exports: [AUTOMATION_EXECUTION_CONSUMER, AUTOMATION_EXECUTION_REPOSITORY],
})
export class AutomationExecutionModule {}
