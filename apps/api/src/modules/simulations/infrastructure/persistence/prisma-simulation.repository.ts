import { Inject, Injectable } from '@nestjs/common'
import type { SimulationCommentRequest } from '@engancha/contracts'
import { PrismaService } from '../../../../platform/database/prisma.service'
import type { SimulationRepository } from '../../domain/ports/simulation.repository'

@Injectable()
export class PrismaSimulationRepository implements SimulationRepository {
  constructor(@Inject(PrismaService) private readonly database: PrismaService) {}

  findSimulatedContent(
    id: string,
    organizationId: string,
    provider: SimulationCommentRequest['provider'],
  ) {
    return this.database.client.content.findFirst({
      where: { id, organizationId, provider, mode: 'SIMULATED' },
      select: { id: true },
    })
  }

  async createOrFind(organizationId: string, input: SimulationCommentRequest) {
    try {
      const execution = await this.database.client.automationExecution.create({
        data: {
          organizationId,
          contentId: input.contentId,
          provider: input.provider,
          mode: 'SIMULATED',
          channelConnectionId: null,
          commentId: input.commentId ?? null,
          idempotencyKey: input.idempotencyKey,
          inputAuthor: input.author,
          inputText: input.text,
          status: 'PENDING',
        },
        select: { id: true, status: true, enqueuedAt: true },
      })

      return { execution, created: true }
    } catch (error) {
      if (!this.isUnique(error)) throw error

      const execution = await this.database.client.automationExecution.findUniqueOrThrow({
        where: {
          organizationId_provider_mode_idempotencyKey: {
            organizationId,
            provider: input.provider,
            mode: 'SIMULATED',
            idempotencyKey: input.idempotencyKey,
          },
        },
        select: { id: true, status: true, enqueuedAt: true },
      })

      return { execution, created: false }
    }
  }

  async markEnqueued(id: string): Promise<void> {
    await this.database.client.automationExecution.update({
      where: { id },
      data: { enqueuedAt: new Date() },
    })
  }

  find(id: string, organizationId: string) {
    return this.database.client.automationExecution.findFirst({
      where: { id, organizationId },
      include: {
        automationRevision: { select: { id: true, version: true } },
        outputs: { orderBy: { position: 'asc' } },
      },
    })
  }

  async resetForRetry(
    id: string,
    organizationId: string,
  ): Promise<{ id: string; status: any; enqueuedAt: Date | null; idempotencyKey: string } | null> {
    const updated = await this.database.client.automationExecution.updateMany({
      where: {
        id,
        organizationId,
        status: 'FAILED',
      },
      data: {
        status: 'PENDING',
        errorCode: null,
        errorMessage: null,
        completedAt: null,
        enqueuedAt: null,
        stateVersion: { increment: 1 },
      },
    })

    if (updated.count === 0) {
      return null
    }

    return this.database.client.automationExecution.findUniqueOrThrow({
      where: { id },
      select: { id: true, status: true, enqueuedAt: true, idempotencyKey: true },
    })
  }

  private isUnique(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
  }
}
