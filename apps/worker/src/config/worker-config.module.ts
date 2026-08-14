import { ConfigModule } from '@nestjs/config'
import { Module } from '@nestjs/common'
import { validateWorkerEnvironment, workerEnvSchema } from './runtime-env'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      validationSchema: workerEnvSchema,
      validate: validateWorkerEnvironment,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
  ],
})
export class WorkerConfigModule {}
