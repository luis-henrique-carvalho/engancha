import { Module } from '@nestjs/common'
import { AuthorizationContextGuard } from '../authorization/authorization-context'
import { WorkspacesController } from './workspaces.controller'
import { WorkspacesService } from './workspaces.service'

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService, AuthorizationContextGuard],
})
export class WorkspacesModule {}
