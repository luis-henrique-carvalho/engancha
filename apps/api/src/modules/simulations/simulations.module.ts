import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { QUEUE_NAMES, automationExecutionJobOptions } from '@engancha/contracts'
import { AuthorizationContextGuard } from '../../platform/security/authorization-context'
import { SimulationsController } from './api/http/simulations.controller'
import { SimulationsService } from './application/simulations.service'
import { AUTOMATION_EXECUTION_DISPATCHER } from './domain/ports/automation-execution-dispatcher.port'
import { SIMULATION_EVENTS_SUBSCRIBER } from './domain/ports/simulation-events-subscriber.port'
import { SIMULATION_REPOSITORY } from './domain/ports/simulation.repository'
import { BullMqAutomationExecutionDispatcher } from './infrastructure/messaging/bullmq-automation-execution.dispatcher'
import { RedisSimulationEventsSubscriber } from './infrastructure/messaging/redis-simulation-events.subscriber'
import { PrismaSimulationRepository } from './infrastructure/persistence/prisma-simulation.repository'

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.automationExecution,
      defaultJobOptions: automationExecutionJobOptions,
    }),
  ],
  controllers: [SimulationsController],
  providers: [
    AuthorizationContextGuard,
    SimulationsService,
    PrismaSimulationRepository,
    { provide: SIMULATION_REPOSITORY, useExisting: PrismaSimulationRepository },
    BullMqAutomationExecutionDispatcher,
    { provide: AUTOMATION_EXECUTION_DISPATCHER, useExisting: BullMqAutomationExecutionDispatcher },
    RedisSimulationEventsSubscriber,
    { provide: SIMULATION_EVENTS_SUBSCRIBER, useExisting: RedisSimulationEventsSubscriber },
  ],
})
export class SimulationsModule {}
