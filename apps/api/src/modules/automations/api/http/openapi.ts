import {
  automationListRequestSchema,
  automationListResponseSchema,
  automationResponseSchema,
  contentListResponseSchema,
  contentResponseSchema,
  createAutomationRequestSchema,
  createContentRequestSchema,
  paginationRequestSchema,
  patchAutomationRequestSchema,
} from '@engancha/contracts'
import type { OpenApiPathRegistrar } from '../../../../platform/http/openapi/shared'
import {
  cookieSecurity,
  idParameterSchema,
  json,
  notFound,
  unprocessable,
  validationFailure,
} from '../../../../platform/http/openapi/shared'

export const registerAutomationsOpenApi: OpenApiPathRegistrar = (registry) => {
  registry.registerPath({
    method: 'get',
    path: '/api/v1/simulated-contents',
    tags: ['Automations'],
    summary: 'Lista conteúdos disponíveis para automações',
    security: cookieSecurity,
    request: { query: paginationRequestSchema },
    responses: {
      200: { description: 'Conteúdos', content: json(contentListResponseSchema) },
      400: validationFailure,
    },
  })
  registry.registerPath({
    method: 'post',
    path: '/api/v1/simulated-contents',
    tags: ['Automations'],
    summary: 'Cria um conteúdo simulado',
    security: cookieSecurity,
    request: { body: { content: json(createContentRequestSchema) } },
    responses: {
      201: { description: 'Conteúdo criado', content: json(contentResponseSchema) },
      400: validationFailure,
    },
  })
  registry.registerPath({
    method: 'get',
    path: '/api/v1/automations',
    tags: ['Automations'],
    summary: 'Lista automações',
    security: cookieSecurity,
    request: { query: automationListRequestSchema },
    responses: {
      200: { description: 'Automações', content: json(automationListResponseSchema) },
      400: validationFailure,
    },
  })
  registry.registerPath({
    method: 'post',
    path: '/api/v1/automations',
    tags: ['Automations'],
    summary: 'Cria uma automação em rascunho',
    security: cookieSecurity,
    request: { body: { content: json(createAutomationRequestSchema) } },
    responses: {
      201: { description: 'Automação criada', content: json(automationResponseSchema) },
      400: validationFailure,
    },
  })
  registry.registerPath({
    method: 'get',
    path: '/api/v1/automations/{id}',
    tags: ['Automations'],
    summary: 'Consulta uma automação',
    security: cookieSecurity,
    request: { params: idParameterSchema },
    responses: {
      200: { description: 'Automação', content: json(automationResponseSchema) },
      404: notFound,
    },
  })
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/automations/{id}',
    tags: ['Automations'],
    summary: 'Edita o rascunho de uma automação',
    security: cookieSecurity,
    request: {
      params: idParameterSchema,
      body: { content: json(patchAutomationRequestSchema) },
    },
    responses: {
      200: { description: 'Automação atualizada', content: json(automationResponseSchema) },
      400: validationFailure,
      404: notFound,
    },
  })
  for (const [path, summary] of [
    ['/api/v1/automations/{id}/publish', 'Publica a revisão atual da automação'],
    ['/api/v1/automations/{id}/pause', 'Pausa uma automação ativa'],
  ] as const) {
    registry.registerPath({
      method: 'post',
      path,
      tags: ['Automations'],
      summary,
      security: cookieSecurity,
      request: { params: idParameterSchema },
      responses: {
        201: { description: 'Automação atualizada', content: json(automationResponseSchema) },
        404: notFound,
        422: unprocessable,
      },
    })
  }
}
