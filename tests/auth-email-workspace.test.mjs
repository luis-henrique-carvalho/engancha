import test from 'node:test'
import assert from 'node:assert/strict'
import {
  developmentEmailOutboxEntrySchema,
  developmentEmailOutboxKey,
  emailDeliveryJobSchema,
} from '@engancha/contracts'
import { processEmailDeliveryJob } from '../apps/worker/src/email/email.job.ts'
import { AuthorizationContextGuard } from '../apps/api/src/authorization/authorization-context.ts'
import { DevelopmentEmailOutboxController } from '../apps/api/src/development-email-outbox/development-email-outbox.controller.ts'

const validJob = {
  version: 'v1',
  correlationId: 'auth-verification-user-1',
  type: 'verification',
  to: 'person@example.com',
  actionUrl: 'https://app.example.com/verify?token=secret-token',
}

test('email delivery contract accepts actions and rejects extra or malformed data', () => {
  assert.equal(emailDeliveryJobSchema.safeParse(validJob).success, true)
  assert.equal(emailDeliveryJobSchema.safeParse({ ...validJob, to: 'not-an-email' }).success, false)
  assert.equal(
    emailDeliveryJobSchema.safeParse({ ...validJob, unexpected: 'secret' }).success,
    false,
  )
})

test('development email outbox retains only the action needed to continue', () => {
  const entry = {
    type: 'verification',
    actionUrl: 'http://localhost:3001/api/auth/verify-email?token=secret-token',
  }

  assert.equal(developmentEmailOutboxEntrySchema.safeParse(entry).success, true)
  assert.equal(
    developmentEmailOutboxEntrySchema.safeParse({ ...entry, to: 'person@example.com' }).success,
    false,
  )
  assert.equal(
    developmentEmailOutboxKey('auth-verification-user-1'),
    'development:email-outbox:auth-verification-user-1',
  )
})

test('development email outbox is retrievable only outside production', async () => {
  const entry = {
    type: 'verification',
    actionUrl: 'http://localhost:3001/api/auth/verify-email?token=secret-token',
  }
  const outbox = { find: async () => entry }
  const development = new DevelopmentEmailOutboxController({ get: () => 'development' }, outbox)

  assert.deepEqual(await development.find('auth-verification-user-1'), entry)

  const production = new DevelopmentEmailOutboxController({ get: () => 'production' }, outbox)
  await assert.rejects(
    production.find('auth-verification-user-1'),
    (error) => error?.getStatus?.() === 404,
  )
})

test('email processor sends through an injected transport without logging payload secrets', async () => {
  const events = []
  const result = await processEmailDeliveryJob(
    { id: 'job-1', data: validJob, attemptsMade: 0, opts: { attempts: 4 } },
    { event: (event, details) => events.push({ event, ...details }) },
    async () => 'mocked',
  )

  assert.deepEqual(result, { status: 'mocked', type: 'verification' })
  assert.doesNotMatch(JSON.stringify(events), /person@example|secret-token/)
  assert.equal(events[0].type, 'verification')
})

test('authorization guard resolves only the active organization membership', async () => {
  const database = {
    client: {
      member: {
        findUnique: async () => ({ id: 'member-1', role: 'owner' }),
      },
    },
  }
  const request = {
    session: {
      user: { id: 'user-1', emailVerified: true },
      session: { id: 'session-1', activeOrganizationId: 'org-1' },
    },
  }
  const guard = new AuthorizationContextGuard(database)

  assert.equal(
    await guard.canActivate({ switchToHttp: () => ({ getRequest: () => request }) }),
    true,
  )
  assert.deepEqual(request.authorizationContext, {
    userId: 'user-1',
    organizationId: 'org-1',
    membershipId: 'member-1',
    role: 'owner',
  })
})

test('authorization guard rejects missing, unverified, and context-less sessions', async () => {
  const guard = new AuthorizationContextGuard({
    client: { member: { findUnique: async () => null } },
  })
  const context = (session) => ({ switchToHttp: () => ({ getRequest: () => ({ session }) }) })

  await assert.rejects(guard.canActivate(context(null)), (error) => error?.getStatus?.() === 401)
  await assert.rejects(
    guard.canActivate(context({ user: { id: 'u', emailVerified: false }, session: {} })),
    (error) => error?.getStatus?.() === 403,
  )
  await assert.rejects(
    guard.canActivate(context({ user: { id: 'u', emailVerified: true }, session: {} })),
    (error) => error?.getStatus?.() === 409,
  )
})
