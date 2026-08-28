import type { INestApplication } from '@nestjs/common'
import { SwaggerModule } from '@nestjs/swagger'
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import type { OpenApiPathRegistrar } from './openapi/shared'

export function configureOpenApi(
  app: INestApplication,
  environment: 'development' | 'test' | 'production',
  registrars: readonly OpenApiPathRegistrar[],
): void {
  if (environment === 'production') return

  const registry = new OpenAPIRegistry()
  registry.registerComponent('securitySchemes', 'betterAuthSession', {
    type: 'apiKey',
    in: 'cookie',
    name: 'better-auth.session_token',
  })
  registrars.forEach((register) => register(registry))

  const document = new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Engancha API',
      description: 'API HTTP do Engancha',
      version: 'v1',
    },
    tags: [
      { name: 'System' },
      { name: 'Workspaces' },
      { name: 'Automations' },
      { name: 'Development' },
    ],
  })

  SwaggerModule.setup('docs', app, document as never, {
    useGlobalPrefix: true,
    ui: true,
    raw: ['json'],
  })
}
