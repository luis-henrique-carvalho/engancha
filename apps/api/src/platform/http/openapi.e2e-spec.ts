import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { apiOpenApiRegistrars } from '../../openapi'
import { configureOpenApi } from './openapi'

describe('OpenAPI documentation', () => {
  let app: INestApplication

  before(async () => {
    const module = await Test.createTestingModule({}).compile()
    app = module.createNestApplication()
    app.setGlobalPrefix('api/v1')
    configureOpenApi(app, 'test', apiOpenApiRegistrars)
    await app.init()
    await app.listen(0, '127.0.0.1')
  })

  after(async () => app.close())

  it('serves the UI and complete OpenAPI document outside production', async () => {
    const http = app.getHttpServer()
    await request(http).get('/api/v1/docs').expect(200)

    const response = await request(http).get('/api/v1/docs-json').expect(200)
    const document = response.body as {
      paths: Record<string, Record<string, { security?: Array<Record<string, string[]>> }>>
    }

    for (const path of [
      '/api/v1/status',
      '/api/v1/health',
      '/api/v1/health/live',
      '/api/v1/health/ready',
      '/api/v1/dev/verification',
      '/api/v1/dev/email-outbox/{correlationId}',
      '/api/v1/workspaces',
      '/api/v1/workspaces/bootstrap',
      '/api/v1/workspaces/active',
      '/api/v1/workspaces/active/members',
      '/api/v1/workspaces/active/invitations',
      '/api/v1/workspaces/{id}',
      '/api/v1/simulated-contents',
      '/api/v1/automations',
      '/api/v1/automations/{id}',
      '/api/v1/automations/{id}/publish',
      '/api/v1/automations/{id}/pause',
    ]) {
      assert.ok(document.paths[path], `Expected ${path} in the OpenAPI document`)
    }

    assert.deepEqual(document.paths['/api/v1/automations'].get.security, [
      { betterAuthSession: [] },
    ])
    assert.match(JSON.stringify(document), /CAPTURE_EMAIL/)
    assert.match(JSON.stringify(document), /VALIDATION_FAILED/)
  })

  it('does not expose documentation in production', async () => {
    const module = await Test.createTestingModule({}).compile()
    const productionApp = module.createNestApplication()
    productionApp.setGlobalPrefix('api/v1')
    configureOpenApi(productionApp, 'production', apiOpenApiRegistrars)
    await productionApp.init()
    await productionApp.listen(0, '127.0.0.1')

    const http = productionApp.getHttpServer()
    await request(http).get('/api/v1/docs').expect(404)
    await request(http).get('/api/v1/docs-json').expect(404)

    await productionApp.close()
  })
})
