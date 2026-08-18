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
import type { AuthorizationContext } from '../../authorization/authorization-context'
import { ContentProviderRegistry } from '../providers/content-provider.port'
import { CONTENT_REPOSITORY, type ContentRepository } from '../repositories/content.repository'
import {
  AUTOMATION_REPOSITORY,
  type AutomationRepository,
} from '../repositories/automation.repository'
import { Inject } from '@nestjs/common'

@Injectable()
export class AutomationsService {
  constructor(
    @Inject(AUTOMATION_REPOSITORY) private readonly automations: AutomationRepository,
    @Inject(CONTENT_REPOSITORY) private readonly contents: ContentRepository,
    private readonly providers: ContentProviderRegistry,
  ) {}
  async list(context: AuthorizationContext, input: PaginationRequest) {
    const { items, total } = await this.automations.list(context.organizationId, input)
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
    const automation = await this.automations.create(context.organizationId, context.userId, input)
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
    await this.automations.transaction(async (tx) => {
      if (Object.keys(data).length)
        await tx.automationRevision.update({ where: { id: draft.id }, data })

      if ('targetId' in input) {
        if (input.targetId === null)
          await tx.automationTarget.deleteMany({ where: { revisionId: draft.id } })
        else if (input.targetId !== undefined) {
          const content = await this.contents.findInOrganization(
            input.targetId,
            context.organizationId,
          )
          if (!content) throw new NotFoundException()
          await tx.automationTarget.upsert({
            where: { revisionId: draft.id },
            create: { revisionId: draft.id, contentId: content.id },
            update: { contentId: content.id },
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
    const complete = await this.automations.transaction((tx) =>
      tx.automationRevision.findUniqueOrThrow({
        where: { id: draft.id },
        include: {
          target: { include: { content: true } },
          trigger: true,
          actions: { orderBy: { position: 'asc' } },
        },
      }),
    )
    const issues = validatePublishableAutomation({
      name: complete.name,
      targetId: complete.target?.contentId,
      keyword: complete.trigger?.keyword,
      actions: complete.actions.map((action: any) => action.config),
    })
    if (issues.length)
      throw new UnprocessableEntityException({
        code: 'AUTOMATION_NOT_PUBLISHABLE',
        message: 'Automation is not publishable',
        issues,
      })
    this.providers.assertPublishable(
      complete.target!.content.provider,
      complete.actions.map((action: any) => action.config as AutomationAction),
    )
    try {
      await this.automations.transaction(async (tx) => {
        await tx.automationRevision.update({
          where: { id: draft.id },
          data: { status: 'PUBLISHED', publishedAt: new Date() },
        })
        await tx.automation.update({
          where: { id },
          data: {
            status: 'ACTIVE',
            currentPublishedRevisionId: draft.id,
            activeContentId: complete.target!.contentId,
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
    await this.automations.transaction((tx) =>
      tx.automation.update({
        where: { id },
        data: {
          status: 'PAUSED',
          activeContentId: null,
          activeKeywordNormalized: null,
          pausedAt: new Date(),
        },
      }),
    )
    return this.get(context, id)
  }
  private async find(context: AuthorizationContext, id: string) {
    const result = await this.automations.find(id, context.organizationId)
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
    const draft = automation.revisions.find((revision: any) => revision.status === 'DRAFT')
    if (draft) return draft
    const published = automation.currentPublishedRevision
    if (!published)
      return this.automations.transaction((tx) =>
        tx.automationRevision.create({
          data: { automationId: automation.id, version: 1 },
        }),
      )
    return this.automations.transaction(async (tx) => {
      const revision = await tx.automationRevision.create({
        data: { automationId: automation.id, version: published.version + 1, name: published.name },
      })
      if (published.target)
        await tx.automationTarget.create({
          data: {
            revisionId: revision.id,
            contentId: published.target.contentId,
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
          data: published.actions.map((action: any) => ({
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
      target: revision.target?.content ?? null,
      keyword: revision.trigger?.keyword ?? null,
      actions: revision.actions.map((action: any) => action.config as AutomationAction),
    }
  }
  private isUnique(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
  }
}
