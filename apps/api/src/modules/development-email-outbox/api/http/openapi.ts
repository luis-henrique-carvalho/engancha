import { developmentEmailOutboxEntrySchema } from '@engancha/contracts'
import type { OpenApiPathRegistrar } from '../../../../platform/http/openapi/shared'
import {
  correlationIdParameterSchema,
  json,
  notFound,
} from '../../../../platform/http/openapi/shared'

export const registerDevelopmentEmailOutboxOpenApi: OpenApiPathRegistrar = (registry) => {
  registry.registerPath({
    method: 'get',
    path: '/api/v1/dev/email-outbox/{correlationId}',
    tags: ['Development'],
    summary: 'Consulta um e-mail de desenvolvimento',
    request: { params: correlationIdParameterSchema },
    responses: {
      200: { description: 'E-mail encontrado', content: json(developmentEmailOutboxEntrySchema) },
      404: notFound,
    },
  })
}
