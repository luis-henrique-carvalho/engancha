import {
  activeWorkspaceResponseSchema,
  createWorkspaceRequestSchema,
  invitationRequestSchema,
  switchActiveWorkspaceRequestSchema,
  workspaceListResponseSchema,
  workspaceMembersListRequestSchema,
  workspaceMembersListResponseSchema,
} from '@engancha/contracts'
import type { OpenApiPathRegistrar } from '../../../../platform/http/openapi/shared'
import {
  conflict,
  cookieSecurity,
  idParameterSchema,
  json,
  notFound,
  unauthenticated,
  validationFailure,
} from '../../../../platform/http/openapi/shared'

export const registerWorkspacesOpenApi: OpenApiPathRegistrar = (registry) => {
  registry.registerPath({
    method: 'post',
    path: '/api/v1/workspaces/bootstrap',
    tags: ['Workspaces'],
    summary: 'Cria ou seleciona o workspace inicial',
    security: cookieSecurity,
    responses: {
      201: { description: 'Workspace ativo', content: json(activeWorkspaceResponseSchema) },
      401: unauthenticated,
      409: conflict,
    },
  })
  registry.registerPath({
    method: 'get',
    path: '/api/v1/workspaces',
    tags: ['Workspaces'],
    summary: 'Lista os workspaces do usuário',
    security: cookieSecurity,
    responses: {
      200: { description: 'Workspaces', content: json(workspaceListResponseSchema) },
      401: unauthenticated,
    },
  })
  registry.registerPath({
    method: 'post',
    path: '/api/v1/workspaces',
    tags: ['Workspaces'],
    summary: 'Cria um workspace',
    security: cookieSecurity,
    request: { body: { content: json(createWorkspaceRequestSchema) } },
    responses: {
      201: { description: 'Workspace criado', content: json(activeWorkspaceResponseSchema) },
      400: validationFailure,
    },
  })
  registry.registerPath({
    method: 'post',
    path: '/api/v1/workspaces/active',
    tags: ['Workspaces'],
    summary: 'Define o workspace ativo',
    security: cookieSecurity,
    request: { body: { content: json(switchActiveWorkspaceRequestSchema) } },
    responses: {
      201: { description: 'Workspace ativo', content: json(activeWorkspaceResponseSchema) },
      400: validationFailure,
      404: notFound,
    },
  })
  registry.registerPath({
    method: 'get',
    path: '/api/v1/workspaces/active',
    tags: ['Workspaces'],
    summary: 'Consulta o workspace ativo',
    security: cookieSecurity,
    responses: {
      200: { description: 'Workspace ativo', content: json(activeWorkspaceResponseSchema) },
      409: conflict,
    },
  })
  registry.registerPath({
    method: 'get',
    path: '/api/v1/workspaces/active/members',
    tags: ['Workspaces'],
    summary: 'Lista membros e convites do workspace ativo',
    security: cookieSecurity,
    request: { query: workspaceMembersListRequestSchema },
    responses: {
      200: { description: 'Membros', content: json(workspaceMembersListResponseSchema) },
      400: validationFailure,
    },
  })
  registry.registerPath({
    method: 'post',
    path: '/api/v1/workspaces/active/invitations',
    tags: ['Workspaces'],
    summary: 'Convida membro para o workspace ativo',
    security: cookieSecurity,
    request: { body: { content: json(invitationRequestSchema) } },
    responses: { 201: { description: 'Convite criado' }, 400: validationFailure },
  })
  registry.registerPath({
    method: 'get',
    path: '/api/v1/workspaces/{id}',
    tags: ['Workspaces'],
    summary: 'Consulta um workspace acessível',
    security: cookieSecurity,
    request: { params: idParameterSchema },
    responses: {
      200: { description: 'Workspace', content: json(activeWorkspaceResponseSchema) },
      404: notFound,
    },
  })
}
