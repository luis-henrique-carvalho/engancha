import type { CreateContentRequest, PaginationRequest } from '@engancha/contracts'
export const CONTENT_REPOSITORY = Symbol('CONTENT_REPOSITORY')
export interface ContentRepository {
  list(
    organizationId: string,
    input: PaginationRequest,
  ): Promise<{ items: unknown[]; total: number }>
  create(organizationId: string, input: CreateContentRequest): Promise<unknown>
  findInOrganization(
    id: string,
    organizationId: string,
  ): Promise<{ id: string; provider: 'INSTAGRAM' | 'TIKTOK' } | null>
}
