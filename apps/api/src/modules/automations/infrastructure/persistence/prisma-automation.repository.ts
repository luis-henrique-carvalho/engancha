import { Injectable } from '@nestjs/common'
import {
  normalizeAutomationKeyword,
  type CreateAutomationRequest,
  type PaginationRequest,
  type PatchAutomationRequest,
} from '@engancha/contracts'
import { PrismaService } from '../../../../platform/database/prisma.service'
import type { AutomationRepository } from '../../domain/ports/automation.repository'

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
  async ensureDraft(id: string, organizationId: string) {
    const automation = await this.find(id, organizationId)
    if (!automation) throw new Error('Automation not found')
    const draft = automation.revisions.find((revision) => revision.status === 'DRAFT')
    if (draft) return draft
    const published = automation.currentPublishedRevision
    if (!published)
      return this.database.client.automationRevision.create({
        data: { automationId: automation.id, version: 1 },
      })
    try {
      return await this.database.client.$transaction(async (database) => {
        const revision = await database.automationRevision.create({
          data: {
            automationId: automation.id,
            version: published.version + 1,
            name: published.name,
          },
        })
        if (published.target)
          await database.automationTarget.create({
            data: { revisionId: revision.id, contentId: published.target.contentId },
          })
        if (published.trigger)
          await database.automationTrigger.create({
            data: {
              revisionId: revision.id,
              keyword: published.trigger.keyword,
              keywordNormalized: published.trigger.keywordNormalized,
            },
          })
        if (published.actions.length)
          await database.automationAction.createMany({
            data: published.actions.map((action) => ({
              revisionId: revision.id,
              position: action.position,
              type: action.type,
              config: action.config as never,
            })),
          })
        return revision
      })
    } catch (error) {
      if (!this.isUnique(error)) throw error
      const concurrent = await this.find(id, organizationId)
      const concurrentDraft = concurrent?.revisions.find((revision) => revision.status === 'DRAFT')
      if (concurrentDraft) return concurrentDraft
      throw error
    }
  }
  async updateDraft(id: string, input: PatchAutomationRequest) {
    await this.database.client.$transaction(async (database) => {
      if ('name' in input)
        await database.automationRevision.update({ where: { id }, data: { name: input.name } })
      if ('targetId' in input) {
        if (input.targetId === null)
          await database.automationTarget.deleteMany({ where: { revisionId: id } })
        else if (input.targetId !== undefined)
          await database.automationTarget.upsert({
            where: { revisionId: id },
            create: { revisionId: id, contentId: input.targetId },
            update: { contentId: input.targetId },
          })
      }
      if ('keyword' in input) {
        if (input.keyword === null)
          await database.automationTrigger.deleteMany({ where: { revisionId: id } })
        else if (input.keyword !== undefined)
          await database.automationTrigger.upsert({
            where: { revisionId: id },
            create: {
              revisionId: id,
              keyword: input.keyword,
              keywordNormalized: normalizeAutomationKeyword(input.keyword),
            },
            update: {
              keyword: input.keyword,
              keywordNormalized: normalizeAutomationKeyword(input.keyword),
            },
          })
      }
      if ('actions' in input) {
        await database.automationAction.deleteMany({ where: { revisionId: id } })
        if (input.actions)
          await database.automationAction.createMany({
            data: input.actions.map((action, position) => ({
              revisionId: id,
              position,
              type: action.type,
              config: action,
            })),
          })
      }
    })
  }
  findRevision(id: string) {
    return this.database.client.automationRevision.findUniqueOrThrow({
      where: { id },
      include: {
        target: { include: { content: true } },
        trigger: true,
        actions: { orderBy: { position: 'asc' } },
      },
    })
  }
  async publish(
    automationId: string,
    revisionId: string,
    activeContentId: string,
    activeKeywordNormalized: string,
  ) {
    await this.database.client.$transaction(async (database) => {
      await database.automationRevision.update({
        where: { id: revisionId },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      })
      await database.automation.update({
        where: { id: automationId },
        data: {
          status: 'ACTIVE',
          currentPublishedRevisionId: revisionId,
          activeContentId,
          activeKeywordNormalized,
          publishedAt: new Date(),
          pausedAt: null,
        },
      })
    })
  }
  async pause(id: string): Promise<void> {
    await this.database.client.automation.update({
      where: { id },
      data: {
        status: 'PAUSED',
        activeContentId: null,
        activeKeywordNormalized: null,
        pausedAt: new Date(),
      },
    })
  }
  private isUnique(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
  }
}
