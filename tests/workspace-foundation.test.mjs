import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'))
}

test('root declares the expected npm workspaces and local tooling', async () => {
  const manifest = await readJson('package.json')

  assert.equal(manifest.private, true)
  assert.deepEqual(manifest.workspaces, ['apps/*', 'packages/*'])
  assert.ok(manifest.devDependencies.typescript)
  assert.ok(manifest.devDependencies.eslint)
  assert.ok(manifest.devDependencies.prettier)
  assert.equal(manifest.scripts['format:check'], 'prettier --check .')
})

test('all workspaces have stable package names and independent runtime scripts', async () => {
  const web = await readJson('apps/web/package.json')
  const api = await readJson('apps/api/package.json')
  const worker = await readJson('apps/worker/package.json')
  const contracts = await readJson('packages/contracts/package.json')

  assert.equal(web.name, '@engancha/web')
  assert.equal(api.name, '@engancha/api')
  assert.equal(worker.name, '@engancha/worker')
  assert.equal(contracts.name, '@engancha/contracts')
  assert.equal(web.scripts.dev, 'vite dev')
  assert.equal(web.scripts.build, 'vite build')
  assert.equal(web.scripts.preview, 'vite preview')
  assert.ok(api.scripts.dev && api.scripts.start)
  assert.ok(worker.scripts.dev && worker.scripts.start)
})

test('workspace dependency boundaries stay explicit', async () => {
  const web = await readFile(path.join(root, 'apps/web/src/routes/index.tsx'), 'utf8')
  const contracts = await readJson('packages/contracts/package.json')

  assert.doesNotMatch(web, /@engancha\/(api|worker)/)
  assert.deepEqual(Object.keys(contracts.dependencies ?? {}), ['zod'])
  assert.doesNotMatch(JSON.stringify(contracts.dependencies ?? {}), /nestjs|prisma|redis|bullmq/i)
  assert.deepEqual(contracts.peerDependencies ?? {}, {})
})

test('API composes platform capabilities and feature modules', async () => {
  const appModule = await readFile(path.join(root, 'apps/api/src/app.module.ts'), 'utf8')
  const verificationModule = await readFile(
    path.join(root, 'apps/api/src/modules/verification/verification.module.ts'),
    'utf8',
  )
  const healthModule = await readFile(
    path.join(root, 'apps/api/src/modules/health/health.module.ts'),
    'utf8',
  )
  const infrastructureModule = await readFile(
    path.join(root, 'apps/api/src/platform/health/infrastructure.module.ts'),
    'utf8',
  )

  assert.match(appModule, /PlatformModule/)
  assert.match(appModule, /HealthModule/)
  assert.match(appModule, /InfrastructureModule/)
  assert.match(appModule, /VerificationModule/)
  assert.match(verificationModule, /controllers: \[VerificationController\]/)
  assert.match(verificationModule, /providers: \[VerificationJobPipe, VerificationService\]/)
  assert.match(healthModule, /controllers: \[HealthController\]/)
  assert.match(infrastructureModule, /exports: \[InfrastructureHealthService\]/)
})

test('the web shell is static and keeps a generated route tree', async () => {
  const rootRoute = await readFile(path.join(root, 'apps/web/src/routes/__root.tsx'), 'utf8')
  const indexRoute = await readFile(path.join(root, 'apps/web/src/routes/index.tsx'), 'utf8')
  const viteConfig = await readFile(path.join(root, 'apps/web/vite.config.ts'), 'utf8')

  assert.match(rootRoute, /Outlet/)
  assert.match(indexRoute, /createFileRoute\('\/'\)/)
  assert.match(viteConfig, /tanstackStart\(\)[\s\S]*viteReact\(\)/)
  assert.match(indexRoute, /Environment ready/i)
})
