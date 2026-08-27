import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createWorkspaceRequestSchema,
  developmentEmailOutboxEntrySchema,
  developmentEmailOutboxKey,
  emailDeliveryJobSchema,
  invitationRequestSchema,
  switchActiveWorkspaceRequestSchema,
  workspaceMembersResponseSchema,
  workspaceListResponseSchema,
} from '@engancha/contracts'
import { processEmailDeliveryJob } from '../apps/worker/src/email/email.job.ts'
import { AuthorizationContextGuard } from '../apps/api/src/platform/security/authorization-context.ts'
import { DevelopmentEmailOutboxController } from '../apps/api/src/modules/development-email-outbox/api/http/development-email-outbox.controller.ts'
import { WorkspacesService } from '../apps/api/src/modules/workspaces/application/workspaces.service.ts'

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

test('workspace contracts expose only frontend-safe memberships and a bounded switch request', () => {
  assert.equal(
    workspaceListResponseSchema.safeParse([
      { id: 'org-a', name: 'Alpha', slug: 'alpha', role: 'owner' },
    ]).success,
    true,
  )
  assert.equal(
    switchActiveWorkspaceRequestSchema.safeParse({ organizationId: 'org-a' }).success,
    true,
  )
  assert.equal(switchActiveWorkspaceRequestSchema.safeParse({ organizationId: '' }).success, false)
  assert.equal(
    workspaceListResponseSchema.safeParse([{ id: 'org-a', name: 'Alpha', slug: 'alpha' }]).success,
    false,
  )
})

test('workspace membership contracts only permit safe workspace creation and member invitations', () => {
  assert.equal(createWorkspaceRequestSchema.safeParse({ name: 'Produto Brasil' }).success, true)
  assert.equal(createWorkspaceRequestSchema.safeParse({ name: '' }).success, false)
  assert.equal(invitationRequestSchema.safeParse({ email: 'ana@example.com' }).success, true)
  assert.equal(
    invitationRequestSchema.safeParse({ email: 'ana@example.com', role: 'owner' }).success,
    false,
  )
  assert.equal(
    workspaceMembersResponseSchema.safeParse([
      {
        id: 'member-1',
        name: 'Ana',
        email: 'ana@example.com',
        emailVerified: true,
        role: 'owner',
        status: 'active',
      },
      {
        id: 'invitation-1',
        name: 'Convite pendente',
        email: 'bia@example.com',
        emailVerified: false,
        role: 'member',
        status: 'invited',
      },
    ]).success,
    true,
  )
})

test('workspace management lists only active-organization people and blocks members from invitations', async () => {
  const database = {
    client: {
      member: {
        findMany: async ({ where }) => {
          assert.deepEqual(where, { organizationId: 'org-active' })
          return [
            {
              id: 'member-1',
              role: 'owner',
              user: { name: 'Ana', email: 'ana@example.com', emailVerified: true },
            },
          ]
        },
      },
      invitation: {
        findMany: async ({ where }) => {
          assert.deepEqual(where, { organizationId: 'org-active', status: 'pending' })
          return [{ id: 'invite-1', email: 'bia@example.com', role: 'member' }]
        },
      },
    },
  }
  const gateway = {
    createOrganization: async () => null,
    createInvitation: async () => ({ id: 'invite-2' }),
  }
  const service = new WorkspacesService(database, gateway)
  const managerRequest = {
    authorizationContext: { organizationId: 'org-active', role: 'owner' },
    session: { user: { id: 'user-1', emailVerified: true }, session: { id: 'session-1' } },
  }

  assert.deepEqual(
    await service.members(
      { page: 1, limit: 1, query: 'bia', role: ['member'], status: ['invited'] },
      managerRequest,
    ),
    {
      items: [
        {
          id: 'invite-1',
          name: 'Convite pendente',
          email: 'bia@example.com',
          emailVerified: false,
          role: 'member',
          status: 'invited',
        },
      ],
      meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
    },
  )

  await assert.rejects(
    service.invite('bia@example.com', {
      ...managerRequest,
      authorizationContext: { organizationId: 'org-active', role: 'member' },
    }),
    (error) => error?.getStatus?.() === 403,
  )
})

test('workspace member lists memberships and switches only the current session to a member organization', async () => {
  const updates = []
  const database = {
    client: {
      member: {
        findMany: async () => [
          {
            organization: { id: 'org-b', name: 'Beta', slug: 'beta' },
            role: 'member',
          },
          {
            organization: { id: 'org-a', name: 'Alpha', slug: 'alpha' },
            role: 'owner',
          },
        ],
        findUnique: async ({ where }) =>
          where.organizationId_userId.organizationId === 'org-b'
            ? {
                organizationId: 'org-b',
                organization: { id: 'org-b', name: 'Beta', slug: 'beta' },
                role: 'member',
              }
            : null,
      },
      session: {
        updateMany: async (value) => {
          updates.push(value)
          return { count: 1 }
        },
      },
    },
  }
  const service = new WorkspacesService(database)
  const request = {
    session: {
      user: { id: 'user-1', emailVerified: true },
      session: { id: 'session-1', activeOrganizationId: 'org-a' },
    },
  }

  assert.deepEqual(await service.list(request), [
    { id: 'org-a', name: 'Alpha', slug: 'alpha', role: 'owner' },
    { id: 'org-b', name: 'Beta', slug: 'beta', role: 'member' },
  ])
  assert.deepEqual(await service.setActive('org-b', request), {
    id: 'org-b',
    name: 'Beta',
    slug: 'beta',
    role: 'member',
  })
  assert.deepEqual(request.session.session.activeOrganizationId, 'org-b')
  assert.deepEqual(updates[0].where, { id: 'session-1', userId: 'user-1' })
  await assert.rejects(
    service.setActive('org-other', request),
    (error) => error?.getStatus?.() === 404,
  )
})

test('bootstrap retains activeOrganizationId when already present in session', async () => {
  const database = {
    client: {
      member: {
        findUnique: async ({ where }) => {
          if (where.organizationId_userId.organizationId === 'org-custom') {
            return {
              id: 'member-custom',
              role: 'admin',
              organization: { id: 'org-custom', name: 'Custom Org', slug: 'custom-org' },
            }
          }
          return null
        },
      },
    },
  }
  const service = new WorkspacesService(database)
  const request = {
    session: {
      user: { id: 'user-1', emailVerified: true },
      session: { id: 'session-1', activeOrganizationId: 'org-custom' },
    },
  }

  const result = await service.bootstrap(request)
  assert.deepEqual(result, {
    id: 'org-custom',
    name: 'Custom Org',
    slug: 'custom-org',
    role: 'admin',
  })
})
