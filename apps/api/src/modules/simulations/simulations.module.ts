import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { QUEUE_NAMES, automationExecutionJobOptions } from '@engancha/contracts'
import { PlatformModule } from '../../platform/platform.module'
import { AuthorizationContextGuard } from '../../platform/security/authorization-context'
import { SimulationsController } from './api/http/simulations.controller'
import {
  createSimulationThrottlerOptions,
  SimulationRateLimitGuard,
} from './api/http/simulation-rate-limit.guard'
import { SimulationsService } from './application/simulations.service'
import { AUTOMATION_EXECUTION_DISPATCHER } from './domain/ports/automation-execution-dispatcher.port'
import { SIMULATION_EVENTS_SUBSCRIBER } from './domain/ports/simulation-events-subscriber.port'
import { SIMULATION_REPOSITORY } from './domain/ports/simulation.repository'
import { BullMqAutomationExecutionDispatcher } from './infrastructure/messaging/bullmq-automation-execution.dispatcher'
import { RedisSimulationEventsSubscriber } from './infrastructure/messaging/redis-simulation-events.subscriber'
import { PrismaSimulationRepository } from './infrastructure/persistence/prisma-simulation.repository'

@Module({
  imports: [
    PlatformModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createSimulationThrottlerOptions,
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.automationExecution,
      defaultJobOptions: automationExecutionJobOptions,
    }),
  ],
  controllers: [SimulationsController],
  providers: [
    AuthorizationContextGuard,
    SimulationRateLimitGuard,
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
