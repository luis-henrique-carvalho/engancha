import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import {
  automationListResponseSchema,
  automationResponseSchema,
  contentResponseSchema,
  validatePublishableAutomation,
  type AutomationAction,
  type CreateAutomationRequest,
  type PaginationRequest,
  type PatchAutomationRequest,
} from '@engancha/contracts'
import type { AuthorizationContext } from '../../../platform/security/authorization-context'
import { ContentProviderRegistry } from '../domain/ports/content-provider.port'
import { CONTENT_REPOSITORY, type ContentRepository } from '../domain/ports/content.repository'
import {
  AUTOMATION_REPOSITORY,
  type AutomationRepository,
} from '../domain/ports/automation.repository'
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
    return automationListResponseSchema.parse({
      items: items.map((item) => this.present(item)),
      meta: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: total ? Math.ceil(total / input.limit) : 0,
      },
    })
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
    const draft = await this.automations.ensureDraft(id, context.organizationId)
    if (input.targetId !== null && input.targetId !== undefined) {
      const content = await this.contents.findInOrganization(input.targetId, context.organizationId)
      if (!content) throw new NotFoundException()
    }
    await this.automations.updateDraft(draft.id, input)
    return this.get(context, id)
  }

  async publish(context: AuthorizationContext, id: string) {
    const automation = await this.find(context, id)
    this.ensureMutable(automation.status)
    const draft = await this.automations.ensureDraft(id, context.organizationId)
    const complete = await this.automations.findRevision(draft.id)
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
      await this.automations.publish(
        id,
        draft.id,
        complete.target!.contentId,
        complete.trigger!.keywordNormalized,
      )
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
    await this.automations.pause(id)
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

  private present(automation: any) {
    const draft = automation.revisions.find((revision: any) => revision.status === 'DRAFT')
    const revision = draft ?? automation.currentPublishedRevision
    return automationResponseSchema.parse({
      id: automation.id,
      status: automation.status,
      createdAt: automation.createdAt.toISOString(),
      updatedAt: automation.updatedAt.toISOString(),
      hasUnpublishedChanges: Boolean(draft && automation.currentPublishedRevision),
      executionCount: 0,
      leadCount: 0,
      draft: draft ? this.revision(draft) : null,
      published: automation.currentPublishedRevision
        ? this.revision(automation.currentPublishedRevision)
        : null,
      current: revision ? this.revision(revision) : null,
    })
  }

  private revision(revision: any) {
    return {
      id: revision.id,
      version: revision.version,
      name: revision.name,
      target: revision.target?.content ? this.presentContent(revision.target.content) : null,
      keyword: revision.trigger?.keyword ?? null,
      actions: revision.actions.map((action: any) => action.config as AutomationAction),
    }
  }

  private presentContent(content: any) {
    return contentResponseSchema.parse({
      id: content.id,
      organizationId: content.organizationId,
      title: content.title,
      externalContentId: content.externalContentId,
      provider: content.provider,
      mode: content.mode,
      contentType: content.contentType,
      createdAt: content.createdAt.toISOString(),
      updatedAt: content.updatedAt.toISOString(),
    })
  }

  private isUnique(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
  }
}
