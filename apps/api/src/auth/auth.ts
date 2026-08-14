import { prismaAdapter } from '@better-auth/prisma-adapter'
import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'
import { config as loadDotenv } from 'dotenv'
import { prisma } from '../database/client'
import { enqueueEmailDelivery } from '../email/email-dispatcher'

loadDotenv({ path: '../../.env' })

const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000'
const authBaseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3001'
const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

function correlationId(userId: string, type: string): string {
  return `auth-${type}-${userId}`
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql', transaction: true }),
  baseURL: authBaseUrl,
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET ?? 'local-development-only-secret-change-me',
  trustedOrigins: [webOrigin, authBaseUrl],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 3_600,
    sendResetPassword: async ({ user, url }) => {
      await enqueueEmailDelivery({
        version: 'v1',
        correlationId: correlationId(user.id, 'reset'),
        type: 'password-reset',
        to: user.email,
        actionUrl: url,
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
    expiresIn: 3_600,
    sendVerificationEmail: async ({ user, url }) => {
      await enqueueEmailDelivery({
        version: 'v1',
        correlationId: correlationId(user.id, 'verification'),
        type: 'verification',
        to: user.email,
        actionUrl: url,
      })
    },
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          prompt: 'select_account',
        },
      }
    : undefined,
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'email-password'],
      allowDifferentEmails: false,
      updateUserInfoOnLink: false,
    },
    encryptOAuthTokens: true,
  },
  plugins: [
    organization({
      requireEmailVerificationOnInvitation: true,
      sendInvitationEmail: async (invitation) => {
        await enqueueEmailDelivery({
          version: 'v1',
          correlationId: `organization-invitation-${invitation.id}`,
          type: 'organization-invitation',
          to: invitation.email,
          actionUrl: new URL(
            `/accept-invitation?invitationId=${invitation.id}`,
            webOrigin,
          ).toString(),
        })
      },
    }),
  ],
  rateLimit: {
    enabled: true,
    window: 900,
    max: 20,
    storage: 'memory',
    customRules: {
      '/sign-up/email': { window: 900, max: 5 },
      '/sign-in/email': { window: 900, max: 10 },
      '/request-password-reset': { window: 900, max: 5 },
      '/send-verification-email': { window: 900, max: 3 },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
})
