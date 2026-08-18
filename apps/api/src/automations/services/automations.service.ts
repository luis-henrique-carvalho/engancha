import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import {
  normalizeAutomationKeyword,
  validatePublishableAutomation,
  type AutomationAction,
  type CreateAutomationRequest,
  type PaginationRequest,
  type PatchAutomationRequest,
} from '@engancha/contracts'
import { PrismaService } from '../../database/prisma.service'
import type { AuthorizationContext } from '../../authorization/authorization-context'

const include = {
  revisions: {
    include: {
      target: { include: { simulatedContent: true } },
      trigger: true,
      actions: { orderBy: { position: 'asc' } },
    },
    orderBy: { version: 'desc' },
  },
  currentPublishedRevision: {
    include: {
      target: { include: { simulatedContent: true } },
      trigger: true,
      actions: { orderBy: { position: 'asc' } },
    },
  },
} as const
@Injectable()
export class AutomationsService {
  constructor(private readonly database: PrismaService) {}
  async list(context: AuthorizationContext, input: PaginationRequest) {
    const where = { organizationId: context.organizationId }
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
    return {
      items: items.map((item) => this.present(item)),
      meta: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: total ? Math.ceil(total / input.limit) : 0,
      },
    }
  }
  async create(context: AuthorizationContext, input: CreateAutomationRequest) {
    const automation = await this.database.client.automation.create({
      data: {
        organizationId: context.organizationId,
        createdByUserId: context.userId,
        revisions: { create: { version: 1, name: input.name } },
      },
      include,
    })
    return this.present(automation)
  }
  async get(context: AuthorizationContext, id: string) {
    return this.present(await this.find(context, id))
  }
  async patch(context: AuthorizationContext, id: string, input: PatchAutomationRequest) {
    const automation = await this.find(context, id)
    this.ensureMutable(automation.status)
    const draft = await this.ensureDraft(automation)
    const data: Record<string, unknown> = {}
    if ('name' in input) data.name = input.name
    await this.database.client.$transaction(async (tx) => {
      if (Object.keys(data).length)
        await tx.automationRevision.update({ where: { id: draft.id }, data })

      if ('targetId' in input) {
        if (input.targetId === null)
          await tx.automationTarget.deleteMany({ where: { revisionId: draft.id } })
        else {
          const content = await tx.simulatedContent.findFirst({
            where: { id: input.targetId, organizationId: context.organizationId },
          })
          if (!content) throw new NotFoundException()
          await tx.automationTarget.upsert({
            where: { revisionId: draft.id },
            create: { revisionId: draft.id, simulatedContentId: content.id },
            update: { simulatedContentId: content.id },
          })
        }
      }
      if ('keyword' in input) {
        if (input.keyword === null)
          await tx.automationTrigger.deleteMany({ where: { revisionId: draft.id } })
        else if (input.keyword !== undefined)
          await tx.automationTrigger.upsert({
            where: { revisionId: draft.id },
            create: {
              revisionId: draft.id,
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
        await tx.automationAction.deleteMany({ where: { revisionId: draft.id } })
        if (input.actions)
          await tx.automationAction.createMany({
            data: input.actions.map((action, position) => ({
              revisionId: draft.id,
              position,
              type: action.type,
              config: action,
            })),
          })
      }
    })
    return this.get(context, id)
  }
  async publish(context: AuthorizationContext, id: string) {
    const automation = await this.find(context, id)
    this.ensureMutable(automation.status)
    const draft = await this.ensureDraft(automation)
    const complete = await this.database.client.automationRevision.findUniqueOrThrow({
      where: { id: draft.id },
      include: { target: true, trigger: true, actions: { orderBy: { position: 'asc' } } },
    })
    const issues = validatePublishableAutomation({
      name: complete.name,
      targetId: complete.target?.simulatedContentId,
      keyword: complete.trigger?.keyword,
      actions: complete.actions.map((action) => action.config),
    })
    if (issues.length)
      throw new UnprocessableEntityException({
        code: 'AUTOMATION_NOT_PUBLISHABLE',
        message: 'Automation is not publishable',
        issues,
      })
    try {
      await this.database.client.$transaction(async (tx) => {
        await tx.automationRevision.update({
          where: { id: draft.id },
          data: { status: 'PUBLISHED', publishedAt: new Date() },
        })
        await tx.automation.update({
          where: { id },
          data: {
            status: 'ACTIVE',
            currentPublishedRevisionId: draft.id,
            activeContentId: complete.target!.simulatedContentId,
            activeKeywordNormalized: complete.trigger!.keywordNormalized,
            publishedAt: new Date(),
            pausedAt: null,
          },
        })
      })
    } catch (error) {
      if (this.isUnique(error))
        throw new ConflictException({
          code: 'AUTOMATION_TRIGGER_CONFLICT',
          message: 'An active automation already uses this content and keyword',
        })
      throw error
    }
    return this.get(context, id)
  }
  async pause(context: AuthorizationContext, id: string) {
    const automation = await this.find(context, id)
    this.ensureMutable(automation.status)
    await this.database.client.automation.update({
      where: { id },
      data: {
        status: 'PAUSED',
        activeContentId: null,
        activeKeywordNormalized: null,
        pausedAt: new Date(),
      },
    })
    return this.get(context, id)
  }
  private async find(context: AuthorizationContext, id: string) {
    const result = await this.database.client.automation.findFirst({
      where: { id, organizationId: context.organizationId },
      include,
    })
    if (!result) throw new NotFoundException()
    return result
  }
  private ensureMutable(status: string) {
    if (status === 'ARCHIVED')
      throw new ConflictException({
        code: 'AUTOMATION_ARCHIVED',
        message: 'Archived automation cannot be changed',
      })
  }
  private async ensureDraft(automation: Awaited<ReturnType<AutomationsService['find']>>) {
    const draft = automation.revisions.find((revision) => revision.status === 'DRAFT')
    if (draft) return draft
    const published = automation.currentPublishedRevision
    if (!published)
      return this.database.client.automationRevision.create({
        data: { automationId: automation.id, version: 1 },
      })
    return this.database.client.$transaction(async (tx) => {
      const revision = await tx.automationRevision.create({
        data: { automationId: automation.id, version: published.version + 1, name: published.name },
      })
      if (published.target)
        await tx.automationTarget.create({
          data: {
            revisionId: revision.id,
            simulatedContentId: published.target.simulatedContentId,
          },
        })
      if (published.trigger)
        await tx.automationTrigger.create({
          data: {
            revisionId: revision.id,
            keyword: published.trigger.keyword,
            keywordNormalized: published.trigger.keywordNormalized,
          },
        })
      if (published.actions.length)
        await tx.automationAction.createMany({
          data: published.actions.map((action) => ({
            revisionId: revision.id,
            position: action.position,
            type: action.type,
            config: action.config as never,
          })),
        })
      return revision
    })
  }
  private present(automation: any) {
    const draft = automation.revisions.find((revision: any) => revision.status === 'DRAFT')
    const revision = draft ?? automation.currentPublishedRevision
    return {
      id: automation.id,
      status: automation.status,
      createdAt: automation.createdAt,
      updatedAt: automation.updatedAt,
      hasUnpublishedChanges: Boolean(draft && automation.currentPublishedRevision),
      executionCount: 0,
      leadCount: 0,
      draft: draft ? this.revision(draft) : null,
      published: automation.currentPublishedRevision
        ? this.revision(automation.currentPublishedRevision)
        : null,
      current: revision ? this.revision(revision) : null,
    }
  }
  private revision(revision: any) {
    return {
      id: revision.id,
      version: revision.version,
      name: revision.name,
      target: revision.target?.simulatedContent ?? null,
      keyword: revision.trigger?.keyword ?? null,
      actions: revision.actions.map((action: any) => action.config as AutomationAction),
    }
  }
  private isUnique(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
  }
}
