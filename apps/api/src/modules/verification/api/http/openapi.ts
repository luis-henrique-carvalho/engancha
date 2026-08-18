import { verificationEnqueueResponseSchema, verificationJobSchema } from '@engancha/contracts'
import type { OpenApiPathRegistrar } from '../../../../platform/http/openapi/shared'
import { json, notFound, validationFailure } from '../../../../platform/http/openapi/shared'

export const registerVerificationOpenApi: OpenApiPathRegistrar = (registry) => {
  registry.registerPath({
    method: 'post',
    path: '/api/v1/dev/verification',
    tags: ['Development'],
    summary: 'Enfileira um e-mail de verificação em ambientes não produtivos',
    request: { body: { content: json(verificationJobSchema) } },
    responses: {
      201: { description: 'Job enfileirado', content: json(verificationEnqueueResponseSchema) },
      400: validationFailure,
      404: notFound,
    },
  })
}
