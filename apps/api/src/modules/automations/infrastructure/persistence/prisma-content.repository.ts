import { Inject, Injectable } from '@nestjs/common'
import type { CreateContentRequest, PaginationRequest } from '@engancha/contracts'
import { PrismaService } from '../../../../platform/database/prisma.service'
import type { ContentRepository } from '../../domain/ports/content.repository'

@Injectable()
export class PrismaContentRepository implements ContentRepository {
  constructor(@Inject(PrismaService) private readonly database: PrismaService) {}
  async list(organizationId: string, input: PaginationRequest) {
    const where = { organizationId }
    const [items, total] = await Promise.all([
      this.database.client.content.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      this.database.client.content.count({ where }),
    ])
    return { items, total }
  }
  create(organizationId: string, input: CreateContentRequest) {
    return this.database.client.content.create({
      data: {
        organizationId,
        title: input.title,
        externalContentId: input.externalContentId,
        provider: input.provider,
        mode: input.mode,
        contentType: input.contentType,
      },
    })
  }
  findInOrganization(id: string, organizationId: string) {
    return this.database.client.content.findFirst({
      where: { id, organizationId },
      select: { id: true, provider: true },
    })
  }
}
