import { Module } from '@nestjs/common'
import { AuthorizationContextGuard } from '../authorization/authorization-context'
import { AutomationsController } from './controllers/automations.controller'
import { SimulatedContentsController } from './controllers/simulated-contents.controller'
import { AutomationsService } from './services/automations.service'
import { SimulatedContentsService } from './services/simulated-contents.service'
import { CONTENT_REPOSITORY } from './repositories/content.repository'
import { PrismaContentRepository } from './repositories/prisma-content.repository'
import { AUTOMATION_REPOSITORY } from './repositories/automation.repository'
import { PrismaAutomationRepository } from './repositories/prisma-automation.repository'
import { CONTENT_PROVIDER_PORTS, ContentProviderRegistry } from './providers/content-provider.port'
import { InstagramContentProvider } from './providers/instagram-content.provider'

@Module({
  controllers: [AutomationsController, SimulatedContentsController],
  providers: [
    AutomationsService,
    SimulatedContentsService,
    AuthorizationContextGuard,
    PrismaContentRepository,
    { provide: CONTENT_REPOSITORY, useExisting: PrismaContentRepository },
    PrismaAutomationRepository,
    { provide: AUTOMATION_REPOSITORY, useExisting: PrismaAutomationRepository },
    InstagramContentProvider,
    {
      provide: CONTENT_PROVIDER_PORTS,
      useFactory: (instagram: InstagramContentProvider) => [instagram],
      inject: [InstagramContentProvider],
    },
    {
      provide: ContentProviderRegistry,
      useFactory: (providers) => new ContentProviderRegistry(providers),
      inject: [CONTENT_PROVIDER_PORTS],
    },
  ],
})
export class AutomationsModule {}
