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
          originAutomationId: input.originAutomationId ?? null,
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
        content: { select: { id: true, title: true, contentType: true, externalContentId: true } },
        automationRevision: { select: { id: true, version: true, name: true } },
        outputs: { orderBy: { position: 'asc' } },
      },
    })
  }

  async list(
    organizationId: string,
    query: {
      automationId?: string
      query?: string
      status?: any[]
      provider?: any[]
      mode?: any[]
      contentType?: any[]
      outputType?: any[]
      cursor?: string
      page?: number
      limit: number
    },
  ) {
    const where = this.buildListWhereClause(organizationId, query)
    const total = await this.database.client.automationExecution.count({ where })
    const page = query.page ?? 1
    const limit = query.limit
    const totalPages = Math.ceil(total / limit) || 1
    const isCursorBased = Boolean(query.cursor)

    const records = await this.database.client.automationExecution.findMany({
      where,
      take: isCursorBased ? limit + 1 : limit,
      ...(isCursorBased ? { cursor: { id: query.cursor }, skip: 1 } : { skip: (page - 1) * limit }),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        content: { select: { id: true, title: true, contentType: true, externalContentId: true } },
        automationRevision: { select: { id: true, version: true, name: true } },
        outputs: { orderBy: { position: 'asc' } },
      },
    })

    const hasMore = isCursorBased ? records.length > limit : page < totalPages
    const items = isCursorBased && records.length > limit ? records.slice(0, limit) : records
    const nextCursor =
      hasMore && items.length > 0 ? (items[items.length - 1] as { id: string }).id : null

    return {
      items,
      nextCursor,
      hasMore,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  }

  private buildListWhereClause(
    organizationId: string,
    query: {
      automationId?: string
      query?: string
      status?: any[]
      provider?: any[]
      mode?: any[]
      contentType?: any[]
      outputType?: any[]
    },
  ) {
    const where: any = { organizationId }
    const andConditions: any[] = []

    if (query.automationId) {
      andConditions.push({
        OR: [{ automationId: query.automationId }, { originAutomationId: query.automationId }],
      })
    }

    if (query.query?.trim()) {
      const searchTerm = query.query.trim()
      andConditions.push({
        OR: [
          { inputAuthor: { contains: searchTerm, mode: 'insensitive' } },
          { inputText: { contains: searchTerm, mode: 'insensitive' } },
          { content: { title: { contains: searchTerm, mode: 'insensitive' } } },
        ],
      })
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    if (query.status?.length) {
      where.status = { in: query.status }
    }

    if (query.provider?.length) {
      where.provider = { in: query.provider }
    }

    if (query.mode?.length) {
      where.mode = { in: query.mode }
    }

    if (query.contentType?.length) {
      where.content = {
        ...(where.content || {}),
        contentType: { in: query.contentType },
      }
    }

    if (query.outputType?.length) {
      where.outputs = {
        some: { type: { in: query.outputType } },
      }
    }

    return where
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
