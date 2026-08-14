import test from 'node:test'
import assert from 'node:assert/strict'
import { emailDeliveryJobSchema } from '@engancha/contracts'
import { processEmailDeliveryJob } from '../apps/worker/src/email/email.job.ts'
import { AuthorizationContextGuard } from '../apps/api/src/authorization/authorization-context.ts'

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
