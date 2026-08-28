import { Body, Controller, Get, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common'
import {
  AuthorizationContextGuard,
  type RequestWithAuthorization,
} from '../../../../platform/security/authorization-context'
import { WorkspacesService } from '../../application/workspaces.service'
import {
  createWorkspaceRequestSchema,
  invitationRequestSchema,
  switchActiveWorkspaceRequestSchema,
  workspaceMembersListRequestSchema,
  type CreateWorkspaceRequest,
  type InvitationRequest,
  type SwitchActiveWorkspaceRequest,
  type WorkspaceMembersListRequest,
} from '@engancha/contracts'
import { ZodValidationPipe } from '../../../../platform/http/zod-validation.pipe'

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
  create(
    @Body(new ZodValidationPipe(createWorkspaceRequestSchema)) body: CreateWorkspaceRequest,
    @Req() request: RequestWithAuthorization,
  ) {
    return this.workspaces.create(body.name, request)
  }

  @Post('active')
  setActive(
    @Body(new ZodValidationPipe(switchActiveWorkspaceRequestSchema))
    body: SwitchActiveWorkspaceRequest,
    @Req() request: RequestWithAuthorization,
  ) {
    return this.workspaces.setActive(body.organizationId, request)
  }

  @Get('active')
  @UseGuards(AuthorizationContextGuard)
  active(@Req() request: RequestWithAuthorization) {
    return this.workspaces.active(request)
  }

  @Get('active/members')
  @UseGuards(AuthorizationContextGuard)
  members(
    @Query(new ZodValidationPipe(workspaceMembersListRequestSchema))
    query: WorkspaceMembersListRequest,
    @Req() request: RequestWithAuthorization,
  ) {
    return this.workspaces.members(query, request)
  }

  @Post('active/invitations')
  @UseGuards(AuthorizationContextGuard)
  invite(
    @Body(new ZodValidationPipe(invitationRequestSchema)) body: InvitationRequest,
    @Req() request: RequestWithAuthorization,
  ) {
    return this.workspaces.invite(body.email, request)
  }

  @Get(':id')
  @UseGuards(AuthorizationContextGuard)
  byId(@Param('id') id: string, @Req() request: RequestWithAuthorization) {
    return this.workspaces.byId(id, request)
  }
}
