import Joi from 'joi'

export const workerEnvSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  REDIS_URL: Joi.string().uri().required(),
  DATABASE_URL: Joi.string()
    .uri()
    .default('postgresql://engancha:engancha@localhost:5432/engancha'),
}).unknown(true)

export type WorkerRuntimeConfig = {
  nodeEnv: 'development' | 'test' | 'production'
  redisUrl: string
  databaseUrl: string
}

export function validateWorkerEnvironment(env: NodeJS.ProcessEnv): WorkerRuntimeConfig {
  const { error, value } = workerEnvSchema.validate(env, { abortEarly: false })

  if (error) {
    const violations = error.details
      .map((detail) => `${detail.path.join('.') || 'environment'} violates ${detail.type}`)
      .join('; ')
    throw new Error(`Configuration validation failed: ${violations}`)
  }

  return { nodeEnv: value.NODE_ENV, redisUrl: value.REDIS_URL, databaseUrl: value.DATABASE_URL }
}
