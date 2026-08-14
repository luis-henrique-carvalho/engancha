import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { Queue } from 'bullmq'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { QUEUE_NAMES } from '@engancha/contracts'

const runE2E = process.env.RUN_E2E === '1'
const port = 3101
const apiOrigin = `http://127.0.0.1:${port}`
const webOrigin = 'http://localhost:3000'
const prefix = `e2e-phase2-${Date.now()}`

let app
let prisma
let queue

function e2eTest(name, fn) {
  return test(name, { skip: !runE2E && 'set RUN_E2E=1 after starting PostgreSQL and Redis' }, fn)
}

function cookies(response) {
  const values = response.headers.getSetCookie?.() ?? [response.headers.get('set-cookie')]
  return values
    .filter(Boolean)
    .map((value) => value.split(';', 1)[0])
    .join('; ')
}

async function request(path, { body, cookie, method = 'POST', redirect = 'manual' } = {}) {
  const response = await fetch(`${apiOrigin}/api/auth${path}`, {
    method,
    redirect,
    headers: {
      origin: webOrigin,
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return { response, body: await response.json().catch(() => undefined), cookie: cookies(response) }
}

async function productRequest(path, { body, cookie, method = 'GET' } = {}) {
  const response = await fetch(`${apiOrigin}/api/v1${path}`, {
    method,
    headers: {
      origin: webOrigin,
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return { response, body: await response.json().catch(() => undefined) }
}

async function waitForEmail(type, email) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const jobs = await queue.getJobs([
      'wait',
      'active',
      'completed',
      'delayed',
      'failed',
      'paused',
      'prioritized',
    ])
    const job = jobs.find(
      (candidate) => candidate.data.type === type && candidate.data.to === email,
    )
    if (job) return job.data
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error(
    `Timed out waiting for ${type} email: ${JSON.stringify(await queue.getJobCounts())}`,
  )
}

async function createVerifiedUser(label) {
  const email = `${prefix}-${label}@example.test`
  const password = 'initial-password-123'
  const signUp = await request('/sign-up/email', {
    body: { name: label, email, password, callbackURL: `${webOrigin}/workspace` },
  })
  assert.equal(signUp.response.status, 200)

  const verification = await waitForEmail('verification', email)
  const action = new URL(verification.actionUrl)
  const verified = await fetch(action, { redirect: 'manual', headers: { origin: webOrigin } })
  assert.equal(verified.status, 302)

  const signedIn = await request('/sign-in/email', { body: { email, password } })
  assert.equal(signedIn.response.status, 200)
  assert.ok(signedIn.cookie)
  return { email, password, cookie: signedIn.cookie }
}

before(async () => {
  if (!runE2E) return
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL ??= 'postgresql://engancha:engancha@localhost:5432/engancha'
  process.env.REDIS_URL ??= 'redis://localhost:6379'
  process.env.BETTER_AUTH_SECRET ??= 'e2e-secret-that-is-long-enough-for-better-auth'
  process.env.BETTER_AUTH_URL = apiOrigin
  process.env.WEB_ORIGIN = webOrigin

  const [{ AppModule }, { prisma: prismaClient }] = await Promise.all([
    import('../apps/api/src/app.module.ts'),
    import('../apps/api/src/database/client.ts'),
  ])
  prisma = prismaClient
  queue = new Queue(QUEUE_NAMES.emailDelivery, { connection: { url: process.env.REDIS_URL } })
  app = await NestFactory.create(AppModule, { logger: false, bodyParser: false })
  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  )
  await app.listen(port, '127.0.0.1')
})

after(async () => {
  if (!runE2E) return
  const users = await prisma.user.findMany({
    where: { email: { startsWith: prefix } },
    select: { id: true },
  })
  const userIds = users.map((user) => user.id)
  await prisma.invitation.deleteMany({
    where: { OR: [{ email: { startsWith: prefix } }, { inviterId: { in: userIds } }] },
  })
  await prisma.organization.deleteMany({ where: { slug: { startsWith: prefix } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await queue?.close()
  await app?.close()
})

e2eTest('confirma e-mail, redefine senha e encerra somente a sessão atual', async () => {
  const user = await createVerifiedUser('auth')

  const resetRequest = await request('/request-password-reset', {
    body: { email: user.email, redirectTo: `${webOrigin}/auth/reset-password` },
  })
  assert.equal(resetRequest.response.status, 200)
  const reset = await waitForEmail('password-reset', user.email)
  const token = new URL(reset.actionUrl).pathname.split('/').at(-1)
  assert.ok(token)

  const resetResult = await request('/reset-password', {
    body: { token, newPassword: 'changed-password-123' },
  })
  assert.equal(resetResult.response.status, 200)

  const previousSession = await request('/get-session', { cookie: user.cookie, method: 'GET' })
  assert.equal(previousSession.body, null)

  const signedIn = await request('/sign-in/email', {
    body: { email: user.email, password: 'changed-password-123' },
  })
  assert.equal(signedIn.response.status, 200)
  const signedOut = await request('/sign-out', { cookie: signedIn.cookie })
  assert.equal(signedOut.response.status, 200)
  const afterLogout = await request('/get-session', { cookie: signedIn.cookie, method: 'GET' })
  assert.equal(afterLogout.body, null)
})

e2eTest('bootstrap concorrente retorna um único workspace ativo', async () => {
  const user = await createVerifiedUser('bootstrap')
  const [first, second] = await Promise.all([
    productRequest('/workspaces/bootstrap', { cookie: user.cookie, method: 'POST' }),
    productRequest('/workspaces/bootstrap', { cookie: user.cookie, method: 'POST' }),
  ])
  assert.equal(first.response.status, 201, JSON.stringify(first.body))
  assert.equal(second.response.status, 201, JSON.stringify(second.body))
  assert.equal(first.body.id, second.body.id)

  const workspaces = await productRequest('/workspaces', { cookie: user.cookie })
  assert.equal(workspaces.response.status, 200)
  assert.equal(workspaces.body.length, 1)
})

e2eTest('isola Organizations, rejeita ID alheio e bloqueia membership removida', async () => {
  const [firstUser, secondUser] = await Promise.all([
    createVerifiedUser('tenant-a'),
    createVerifiedUser('tenant-b'),
  ])
  const [firstWorkspace, secondWorkspace] = await Promise.all([
    productRequest('/workspaces/bootstrap', { cookie: firstUser.cookie, method: 'POST' }),
    productRequest('/workspaces/bootstrap', { cookie: secondUser.cookie, method: 'POST' }),
  ])
  assert.equal(firstWorkspace.response.status, 201, JSON.stringify(firstWorkspace.body))
  assert.equal(secondWorkspace.response.status, 201, JSON.stringify(secondWorkspace.body))

  const guessed = await productRequest(`/workspaces/${secondWorkspace.body.id}`, {
    cookie: firstUser.cookie,
  })
  assert.equal(guessed.response.status, 404)

  const unauthorizedSwitch = await productRequest('/workspaces/active', {
    cookie: firstUser.cookie,
    method: 'POST',
    body: { organizationId: secondWorkspace.body.id },
  })
  assert.equal(unauthorizedSwitch.response.status, 404)

  const first = await prisma.user.findUnique({ where: { email: firstUser.email } })
  await prisma.member.deleteMany({
    where: { userId: first.id, organizationId: firstWorkspace.body.id },
  })
  const revoked = await productRequest('/workspaces/active', { cookie: firstUser.cookie })
  assert.equal(revoked.response.status, 409)
})
