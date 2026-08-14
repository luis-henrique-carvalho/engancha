import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import {
  AuthorizationContextGuard,
  type RequestWithAuthorization,
} from '../authorization/authorization-context'
import { WorkspacesService } from './workspaces.service'

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Post('bootstrap')
  bootstrap(@Req() request: RequestWithAuthorization) {
    return this.workspaces.bootstrap(request as Parameters<WorkspacesService['bootstrap']>[0])
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
