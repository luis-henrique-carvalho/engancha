import { registerAutomationsOpenApi } from './modules/automations/api/http/openapi'
import { registerSimulationsOpenApi } from './modules/simulations/api/http/openapi'
import { registerDevelopmentEmailOutboxOpenApi } from './modules/development-email-outbox/api/http/openapi'
import { registerVerificationOpenApi } from './modules/verification/api/http/openapi'
import { registerWorkspacesOpenApi } from './modules/workspaces/api/http/openapi'
import { registerSystemOpenApi } from './platform/http/openapi/system.openapi'

export const apiOpenApiRegistrars = [
  registerSystemOpenApi,
  registerVerificationOpenApi,
  registerDevelopmentEmailOutboxOpenApi,
  registerWorkspacesOpenApi,
  registerAutomationsOpenApi,
  registerSimulationsOpenApi,
]
