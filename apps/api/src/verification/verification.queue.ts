import { Injectable, OnApplicationShutdown } from '@nestjs/common'
import { Queue } from 'bullmq'
import { ConfigService } from '@nestjs/config'
import { queueNames, verificationJobOptions, type VerificationJob } from '@engancha/contracts'

export const VERIFICATION_QUEUE = Symbol('VERIFICATION_QUEUE')

export type VerificationQueue = {
  add(
    name: string,
    data: VerificationJob,
    options: typeof verificationJobOptions,
  ): Promise<{ id?: string | number }>
  close?(): Promise<void>
}

function redisConnection(redisUrl: string) {
  const url = new URL(redisUrl)
  const database = url.pathname.length > 1 ? Number(url.pathname.slice(1)) : undefined

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: Number.isInteger(database) ? database : undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
  }
}

@Injectable()
export class VerificationQueueLifecycle implements OnApplicationShutdown {
  constructor(private readonly queue: VerificationQueue) {}

  async onApplicationShutdown(): Promise<void> {
    await this.queue.close?.()
  }
}

export function createVerificationQueue(config: ConfigService): Queue {
  return new Queue(queueNames.verification, {
    connection: redisConnection(config.getOrThrow<string>('redisUrl')),
  })
}
