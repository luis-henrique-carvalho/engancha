import Joi from 'joi'

export const apiEnvSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3001),
  DATABASE_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),
  BETTER_AUTH_SECRET: Joi.string()
    .min(32)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.string().default('local-development-only-secret-change-me'),
    }),
  BETTER_AUTH_URL: Joi.string().uri().default('http://localhost:3001'),
  WEB_ORIGIN: Joi.string().uri().default('http://localhost:3000'),
  GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional(),
  RESEND_API_KEY: Joi.string().allow('').optional(),
  RESEND_FROM: Joi.string().default('onboarding@example.com'),
}).unknown(true)

export type ApiRuntimeConfig = {
  nodeEnv: 'development' | 'test' | 'production'
  port: number
  databaseUrl: string
  redisUrl: string
  betterAuthSecret: string
  betterAuthUrl: string
  webOrigin: string
}

export function validateApiEnvironment(env: NodeJS.ProcessEnv): ApiRuntimeConfig {
  const { error, value } = apiEnvSchema.validate(env, { abortEarly: false })

  if (error) {
    const violations = error.details
      .map((detail) => `${detail.path.join('.') || 'environment'} violates ${detail.type}`)
      .join('; ')
    throw new Error(`Configuration validation failed: ${violations}`)
  }

  return {
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
    databaseUrl: value.DATABASE_URL,
    redisUrl: value.REDIS_URL,
    betterAuthSecret: value.BETTER_AUTH_SECRET,
    betterAuthUrl: value.BETTER_AUTH_URL,
    webOrigin: value.WEB_ORIGIN,
  }
}
