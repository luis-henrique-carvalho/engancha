import Joi from 'joi'

export const apiEnvSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3001),
  DATABASE_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),
}).unknown(true)

export type ApiRuntimeConfig = {
  nodeEnv: 'development' | 'test' | 'production'
  port: number
  databaseUrl: string
  redisUrl: string
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
  }
}
