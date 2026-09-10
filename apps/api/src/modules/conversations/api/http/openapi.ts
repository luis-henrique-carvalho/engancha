import {
  emailCaptureResponseResultSchema,
  emailCaptureResponseSubmissionSchema,
} from '@engancha/contracts'
import { z } from '../../../../platform/http/zod-openapi'
import {
  conflict,
  cookieSecurity,
  forbidden,
  json,
  notFound,
  type OpenApiPathRegistrar,
  validationFailure,
} from '../../../../platform/http/openapi/shared'

const emailCaptureParamsSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: 'id', in: 'path' } }),
  captureId: z
    .string()
    .min(1)
    .openapi({ param: { name: 'captureId', in: 'path' } }),
})

export const registerConversationsOpenApi: OpenApiPathRegistrar = (registry) => {
  registry.registerPath({
    method: 'post',
    path: '/api/v1/conversations/{id}/email-captures/{captureId}/responses',
    tags: ['Conversations'],
    summary: 'Submit simulated follower email capture response',
    security: cookieSecurity,
    request: {
      params: emailCaptureParamsSchema,
      body: { content: json(emailCaptureResponseSubmissionSchema) },
    },
    responses: {
      200: {
        description: 'Capture response accepted or completed',
        content: json(emailCaptureResponseResultSchema),
      },
      400: validationFailure,
      403: forbidden,
      404: notFound,
      409: conflict,
    },
  })
}
