import { Body, Controller, Get, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common'
import {
  AuthorizationContextGuard,
  type RequestWithAuthorization,
} from '../authorization/authorization-context'
import { WorkspacesService } from './workspaces.service'
import { SwitchActiveWorkspaceDto } from './dto/switch-active-workspace.dto'
import { CreateWorkspaceDto } from './dto/create-workspace.dto'
import { CreateInvitationDto } from './dto/create-invitation.dto'
import { ListWorkspaceMembersDto } from './dto/list-workspace-members.dto'

@Controller('workspaces')
export class WorkspacesController {
  constructor(@Inject(WorkspacesService) private readonly workspaces: WorkspacesService) {}

  @Post('bootstrap')
  bootstrap(@Req() request: RequestWithAuthorization) {
    return this.workspaces.bootstrap(request as Parameters<WorkspacesService['bootstrap']>[0])
  }

  @Get()
  list(@Req() request: RequestWithAuthorization) {
    return this.workspaces.list(request)
  }

  @Post()
  create(@Body() body: CreateWorkspaceDto, @Req() request: RequestWithAuthorization) {
    return this.workspaces.create(body.name, request)
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

  @Get('active/members')
  @UseGuards(AuthorizationContextGuard)
  members(@Query() query: ListWorkspaceMembersDto, @Req() request: RequestWithAuthorization) {
    return this.workspaces.members(query, request)
  }

  @Post('active/invitations')
  @UseGuards(AuthorizationContextGuard)
  invite(@Body() body: CreateInvitationDto, @Req() request: RequestWithAuthorization) {
    return this.workspaces.invite(body.email, request)
  }

  @Get(':id')
  @UseGuards(AuthorizationContextGuard)
  byId(@Param('id') id: string, @Req() request: RequestWithAuthorization) {
    return this.workspaces.byId(id, request)
  }
}
