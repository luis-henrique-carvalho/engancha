import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from '../zod-openapi'

export type OpenApiPathRegistrar = (registry: OpenAPIRegistry) => void

export const cookieSecurity = [{ betterAuthSession: [] }]

export const idParameterSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: 'id', in: 'path' } }),
})

export const correlationIdParameterSchema = z.object({
  correlationId: z
    .string()
    .min(1)
    .openapi({ param: { name: 'correlationId', in: 'path' } }),
})

export const validationFailure = {
  description: 'Payload ou parâmetros inválidos',
  content: {
    'application/json': {
      schema: z.object({
        code: z.literal('VALIDATION_FAILED'),
        message: z.literal('Validation failed'),
        issues: z.array(z.object({ path: z.string(), message: z.string() })),
      }),
    },
  },
}

export const unauthenticated = { description: 'Autenticação obrigatória' }
export const forbidden = { description: 'Ação não permitida para o usuário atual' }
export const notFound = { description: 'Recurso não encontrado' }
export const conflict = { description: 'Estado atual impede a operação' }
export const unprocessable = { description: 'Recurso não está pronto para a operação' }

export function json(schema: z.ZodType) {
  return { 'application/json': { schema } }
}
