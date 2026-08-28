import { Module } from '@nestjs/common'
import { CoreModule } from '../common/core.module'
import { BullMqAutomationExecutionProcessor } from './infrastructure/messaging/bullmq-automation-execution.processor'
import { AUTOMATION_EXECUTION_CONSUMER } from './domain/ports/automation-execution-consumer.port'
import { AUTOMATION_EXECUTION_REPOSITORY } from './domain/ports/automation-execution-repository.port'
import { SIMULATION_EVENTS_PUBLISHER } from './domain/ports/simulation-events-publisher.port'
import { AutomationExecutionService } from './application/automation-execution.service'
import { PrismaAutomationExecutionRepository } from './infrastructure/persistence/prisma-automation-execution.repository'
import { RedisSimulationEventsPublisher } from './infrastructure/messaging/redis-simulation-events.publisher'

@Module({
  imports: [CoreModule],
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
    RedisSimulationEventsPublisher,
    {
      provide: SIMULATION_EVENTS_PUBLISHER,
      useExisting: RedisSimulationEventsPublisher,
    },
    BullMqAutomationExecutionProcessor,
  ],
  exports: [
    AUTOMATION_EXECUTION_CONSUMER,
    AUTOMATION_EXECUTION_REPOSITORY,
    SIMULATION_EVENTS_PUBLISHER,
  ],
})
export class AutomationExecutionModule {}
