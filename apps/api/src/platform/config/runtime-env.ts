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
  SIMULATION_CREATE_RATE_LIMIT: Joi.number().integer().min(1).default(5),
  SIMULATION_CREATE_RATE_LIMIT_TTL_MS: Joi.number().integer().min(100).default(60_000),
  SIMULATION_CREATE_RATE_LIMIT_BLOCK_DURATION_MS: Joi.number().integer().min(100).default(1_000),
  SIMULATION_RETRY_RATE_LIMIT: Joi.number().integer().min(1).default(5),
  SIMULATION_RETRY_RATE_LIMIT_TTL_MS: Joi.number().integer().min(100).default(60_000),
  SIMULATION_RETRY_RATE_LIMIT_BLOCK_DURATION_MS: Joi.number().integer().min(100).default(1_000),
  SIMULATION_READ_RATE_LIMIT: Joi.number().integer().min(1).default(20),
  SIMULATION_READ_RATE_LIMIT_TTL_MS: Joi.number().integer().min(100).default(60_000),
  SIMULATION_READ_RATE_LIMIT_BLOCK_DURATION_MS: Joi.number().integer().min(100).default(1_000),
}).unknown(true)

export type ApiRuntimeConfig = {
  nodeEnv: 'development' | 'test' | 'production'
  port: number
  databaseUrl: string
  redisUrl: string
  betterAuthSecret: string
  betterAuthUrl: string
  webOrigin: string
  simulationCreateRateLimit: number
  simulationCreateRateLimitTtlMs: number
  simulationCreateRateLimitBlockDurationMs: number
  simulationRetryRateLimit: number
  simulationRetryRateLimitTtlMs: number
  simulationRetryRateLimitBlockDurationMs: number
  simulationReadRateLimit: number
  simulationReadRateLimitTtlMs: number
  simulationReadRateLimitBlockDurationMs: number
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
    simulationCreateRateLimit: value.SIMULATION_CREATE_RATE_LIMIT,
    simulationCreateRateLimitTtlMs: value.SIMULATION_CREATE_RATE_LIMIT_TTL_MS,
    simulationCreateRateLimitBlockDurationMs: value.SIMULATION_CREATE_RATE_LIMIT_BLOCK_DURATION_MS,
    simulationRetryRateLimit: value.SIMULATION_RETRY_RATE_LIMIT,
    simulationRetryRateLimitTtlMs: value.SIMULATION_RETRY_RATE_LIMIT_TTL_MS,
    simulationRetryRateLimitBlockDurationMs: value.SIMULATION_RETRY_RATE_LIMIT_BLOCK_DURATION_MS,
    simulationReadRateLimit: value.SIMULATION_READ_RATE_LIMIT,
    simulationReadRateLimitTtlMs: value.SIMULATION_READ_RATE_LIMIT_TTL_MS,
    simulationReadRateLimitBlockDurationMs: value.SIMULATION_READ_RATE_LIMIT_BLOCK_DURATION_MS,
  }
}
