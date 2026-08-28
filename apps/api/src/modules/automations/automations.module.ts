import { Module } from '@nestjs/common'
import { AuthorizationContextGuard } from '../../platform/security/authorization-context'
import { AutomationsController } from './api/http/automations.controller'
import { SimulatedContentsController } from './api/http/simulated-contents.controller'
import { AutomationsService } from './application/automations.service'
import { SimulatedContentsService } from './application/simulated-contents.service'
import { CONTENT_REPOSITORY } from './domain/ports/content.repository'
import { PrismaContentRepository } from './infrastructure/persistence/prisma-content.repository'
import { AUTOMATION_REPOSITORY } from './domain/ports/automation.repository'
import { PrismaAutomationRepository } from './infrastructure/persistence/prisma-automation.repository'
import {
  CONTENT_PROVIDER_PORTS,
  ContentProviderRegistry,
} from './domain/ports/content-provider.port'
import { InstagramContentProvider } from './infrastructure/providers/instagram-content.provider'

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
