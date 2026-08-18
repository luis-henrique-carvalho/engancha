import {
  healthReportSchema,
  livenessResponseSchema,
  statusResponseSchema,
} from '@engancha/contracts'
import type { OpenApiPathRegistrar } from './shared'
import { json } from './shared'

export const registerSystemOpenApi: OpenApiPathRegistrar = (registry) => {
  registry.registerPath({
    method: 'get',
    path: '/api/v1/status',
    tags: ['System'],
    summary: 'Consulta o estado da API',
    responses: { 200: { description: 'API disponível', content: json(statusResponseSchema) } },
  })
  registry.registerPath({
    method: 'get',
    path: '/api/v1/health/live',
    tags: ['System'],
    summary: 'Consulta a liveness da API',
    responses: {
      200: { description: 'API disponível', content: json(livenessResponseSchema) },
    },
  })
  for (const path of ['/api/v1/health', '/api/v1/health/ready']) {
    registry.registerPath({
      method: 'get',
      path,
      tags: ['System'],
      summary: 'Consulta a readiness da API',
      responses: {
        200: { description: 'Dependências disponíveis', content: json(healthReportSchema) },
        503: {
          description: 'Uma dependência está indisponível',
          content: json(healthReportSchema),
        },
      },
    })
  }
}
