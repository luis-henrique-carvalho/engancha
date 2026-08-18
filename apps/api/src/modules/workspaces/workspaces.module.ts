import { Module } from '@nestjs/common'
import { AuthorizationContextGuard } from '../../platform/security/authorization-context'
import { WorkspacesController } from './api/http/workspaces.controller'
import { WorkspacesService } from './application/workspaces.service'
import { OrganizationGateway } from './domain/organization.gateway'

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService, OrganizationGateway, AuthorizationContextGuard],
})
export class WorkspacesModule {}
