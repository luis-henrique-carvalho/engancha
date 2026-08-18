import { ConflictException, Inject, Injectable } from '@nestjs/common'
import {
  contentListResponseSchema,
  contentResponseSchema,
  type CreateContentRequest,
  type PaginationRequest,
} from '@engancha/contracts'
import type { AuthorizationContext } from '../../../platform/security/authorization-context'
import { CONTENT_REPOSITORY, type ContentRepository } from '../domain/ports/content.repository'

@Injectable()
export class SimulatedContentsService {
  constructor(@Inject(CONTENT_REPOSITORY) private readonly contents: ContentRepository) {}
  async list(context: AuthorizationContext, input: PaginationRequest) {
    const { items, total } = await this.contents.list(context.organizationId, input)
    return contentListResponseSchema.parse({
      items: items.map((content) => this.present(content)),
      meta: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: total ? Math.ceil(total / input.limit) : 0,
      },
    })
  }

  async create(context: AuthorizationContext, input: CreateContentRequest) {
    try {
      return this.present(await this.contents.create(context.organizationId, input))
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

  private present(content: any) {
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
}
