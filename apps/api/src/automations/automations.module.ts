import { Module } from '@nestjs/common'
import { AuthorizationContextGuard } from '../authorization/authorization-context'
import { AutomationsController } from './controllers/automations.controller'
import { SimulatedContentsController } from './controllers/simulated-contents.controller'
import { AutomationsService } from './services/automations.service'
import { SimulatedContentsService } from './services/simulated-contents.service'

@Module({
  controllers: [AutomationsController, SimulatedContentsController],
  providers: [AutomationsService, SimulatedContentsService, AuthorizationContextGuard],
})
export class AutomationsModule {}
