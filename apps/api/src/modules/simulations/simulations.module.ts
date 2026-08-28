import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { QUEUE_NAMES, automationExecutionJobOptions } from '@engancha/contracts'
import { AuthorizationContextGuard } from '../../platform/security/authorization-context'
import { SimulationsController } from './api/http/simulations.controller'
import { SimulationsService } from './application/simulations.service'
import { SIMULATION_REPOSITORY } from './domain/ports/simulation.repository'
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
  ],
})
export class SimulationsModule {}
