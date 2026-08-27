import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const routeTreePath = new URL('../apps/web/src/routeTree.gen.ts', import.meta.url)
const sidebarPath = new URL(
  '../apps/web/src/components/layout/data/sidebar-data.ts',
  import.meta.url,
)

test('web route tree exposes only Engancha routes', async () => {
  const source = await readFile(routeTreePath, 'utf8')

  for (const route of [
    "'/auth/login'",
    "'/auth/register'",
    "'/auth/forgot-password'",
    "'/auth/reset-password'",
    "'/auth/verify-email'",
    "'/workspace'",
    "'/users'",
    "'/automations'",
    "'/automations/$automationId'",
    "'/automations/$automationId/identification'",
    "'/automations/$automationId/content'",
    "'/automations/$automationId/keyword'",
    "'/automations/$automationId/public-reply'",
    "'/automations/$automationId/direct-message'",
    "'/automations/$automationId/final-action'",
    "'/automations/$automationId/review'",
  ]) {
    assert.match(source, new RegExp(route.replaceAll('/', '\\/').replaceAll('$', '\\$')))
  }

  for (const forbidden of ['tasks', 'apps', 'settings', 'chats', 'clerk', '_authenticated']) {
    assert.doesNotMatch(source, new RegExp(`/${forbidden}`))
  }
})

test('sidebar data exposes workspace people navigation without reference-only routes', async () => {
  const source = await readFile(sidebarPath, 'utf8')
  assert.match(source, /url: '\/workspace'/)
  assert.match(source, /url: '\/automations'/)
  assert.match(source, /url: '\/users'/)
  assert.doesNotMatch(source, /tasks|apps|settings|chats|clerk|_authenticated/)
})
