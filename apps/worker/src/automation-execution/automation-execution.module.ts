import { Module } from '@nestjs/common'
import { BullMqAutomationExecutionProcessor } from './infrastructure/messaging/bullmq-automation-execution.processor'
import { AUTOMATION_EXECUTION_CONSUMER } from './domain/ports/automation-execution-consumer.port'
import { AutomationExecutionService } from './application/automation-execution.service'

@Module({
  providers: [
    AutomationExecutionService,
    {
      provide: AUTOMATION_EXECUTION_CONSUMER,
      useExisting: AutomationExecutionService,
    },
    BullMqAutomationExecutionProcessor,
  ],
  exports: [AUTOMATION_EXECUTION_CONSUMER],
})
export class AutomationExecutionModule {}
