import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import {
  AuthorizationContextGuard,
  type RequestWithAuthorization,
} from '../authorization/authorization-context'
import { WorkspacesService } from './workspaces.service'
import { SwitchActiveWorkspaceDto } from './dto/switch-active-workspace.dto'

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Post('bootstrap')
  bootstrap(@Req() request: RequestWithAuthorization) {
    return this.workspaces.bootstrap(request as Parameters<WorkspacesService['bootstrap']>[0])
  }

  @Get()
  list(@Req() request: RequestWithAuthorization) {
    return this.workspaces.list(request)
  }

  @Post('active')
  setActive(@Body() body: SwitchActiveWorkspaceDto, @Req() request: RequestWithAuthorization) {
    return this.workspaces.setActive(body.organizationId, request)
  }

  @Get('active')
  @UseGuards(AuthorizationContextGuard)
  active(@Req() request: RequestWithAuthorization) {
    return this.workspaces.active(request)
  }

  @Get(':id')
  @UseGuards(AuthorizationContextGuard)
  byId(@Param('id') id: string, @Req() request: RequestWithAuthorization) {
    return this.workspaces.byId(id, request)
  }
}
