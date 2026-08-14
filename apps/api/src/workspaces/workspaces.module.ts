import { Module } from '@nestjs/common'
import { AuthorizationContextGuard } from '../authorization/authorization-context'
import { WorkspacesController } from './workspaces.controller'
import { WorkspacesService } from './workspaces.service'
import { OrganizationGateway } from './organization.gateway'

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService, OrganizationGateway, AuthorizationContextGuard],
})
export class WorkspacesModule {}
