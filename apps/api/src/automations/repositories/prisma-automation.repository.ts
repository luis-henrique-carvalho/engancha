import { Injectable } from '@nestjs/common'
import type { CreateAutomationRequest, PaginationRequest } from '@engancha/contracts'
import { PrismaService } from '../../database/prisma.service'
import type { AutomationRepository } from './automation.repository'

const include = {
  revisions: {
    include: {
      target: { include: { content: true } },
      trigger: true,
      actions: { orderBy: { position: 'asc' } },
    },
    orderBy: { version: 'desc' },
  },
  currentPublishedRevision: {
    include: {
      target: { include: { content: true } },
      trigger: true,
      actions: { orderBy: { position: 'asc' } },
    },
  },
} as const
@Injectable()
export class PrismaAutomationRepository implements AutomationRepository {
  constructor(private readonly database: PrismaService) {}
  async list(organizationId: string, input: PaginationRequest) {
    const where = { organizationId }
    const [items, total] = await Promise.all([
      this.database.client.automation.findMany({
        where,
        include,
        orderBy: { updatedAt: 'desc' },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      this.database.client.automation.count({ where }),
    ])
    return { items, total }
  }
  create(organizationId: string, userId: string, input: CreateAutomationRequest) {
    return this.database.client.automation.create({
      data: {
        organizationId,
        createdByUserId: userId,
        revisions: { create: { version: 1, name: input.name } },
      },
      include,
    })
  }
  find(id: string, organizationId: string) {
    return this.database.client.automation.findFirst({ where: { id, organizationId }, include })
  }
  transaction(work: (database: any) => Promise<any>) {
    return this.database.client.$transaction(work)
  }
}
