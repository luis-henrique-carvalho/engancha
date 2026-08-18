import { ConflictException, Injectable } from '@nestjs/common'
import type { CreateSimulatedContentRequest, PaginationRequest } from '@engancha/contracts'
import { PrismaService } from '../../database/prisma.service'
import type { AuthorizationContext } from '../../authorization/authorization-context'

@Injectable()
export class SimulatedContentsService {
  constructor(private readonly database: PrismaService) {}
  async list(context: AuthorizationContext, input: PaginationRequest) {
    const where = { organizationId: context.organizationId }
    const [items, total] = await Promise.all([
      this.database.client.simulatedContent.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      this.database.client.simulatedContent.count({ where }),
    ])
    return {
      items,
      meta: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: total ? Math.ceil(total / input.limit) : 0,
      },
    }
  }
  async create(context: AuthorizationContext, input: CreateSimulatedContentRequest) {
    try {
      return await this.database.client.simulatedContent.create({
        data: {
          organizationId: context.organizationId,
          title: input.title,
          externalContentId: input.externalContentId,
        },
      })
    } catch (error) {
      if (this.isUnique(error))
        throw new ConflictException({
          code: 'SIMULATED_CONTENT_CONFLICT',
          message: 'Content already exists',
        })
      throw error
    }
  }
  private isUnique(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
  }
}
