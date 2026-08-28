import {
  simulationCommentRequestSchema,
  simulationCommentResponseSchema,
  simulationExecutionResponseSchema,
} from '@engancha/contracts'
import type { OpenApiPathRegistrar } from '../../../../platform/http/openapi/shared'
import {
  cookieSecurity,
  idParameterSchema,
  json,
  notFound,
  validationFailure,
} from '../../../../platform/http/openapi/shared'

export const registerSimulationsOpenApi: OpenApiPathRegistrar = (registry) => {
  registry.registerPath({
    method: 'post',
    path: '/api/v1/simulations/comments',
    tags: ['Simulations'],
    summary: 'Submete um comentário simulado para processamento',
    security: cookieSecurity,
    request: { body: { content: json(simulationCommentRequestSchema) } },
    responses: {
      201: {
        description: 'Execução simulada pendente',
        content: json(simulationCommentResponseSchema),
      },
      400: validationFailure,
      404: notFound,
    },
  })
  registry.registerPath({
    method: 'get',
    path: '/api/v1/simulations/executions/{id}',
    tags: ['Simulations'],
    summary: 'Consulta a projeção autoritativa de uma execução simulada',
    security: cookieSecurity,
    request: { params: idParameterSchema },
    responses: {
      200: { description: 'Execução simulada', content: json(simulationExecutionResponseSchema) },
      404: notFound,
    },
  })
}
