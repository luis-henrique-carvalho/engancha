import type {
  CreateAutomationRequest,
  PaginationRequest,
  PatchAutomationRequest,
} from '@engancha/contracts'
export const AUTOMATION_REPOSITORY = Symbol('AUTOMATION_REPOSITORY')
export interface AutomationRepository {
  list(organizationId: string, input: PaginationRequest): Promise<{ items: any[]; total: number }>
  create(organizationId: string, userId: string, input: CreateAutomationRequest): Promise<any>
  find(id: string, organizationId: string): Promise<any | null>
  ensureDraft(id: string, organizationId: string): Promise<any>
  updateDraft(id: string, input: PatchAutomationRequest): Promise<void>
  findRevision(id: string): Promise<any>
  publish(
    automationId: string,
    revisionId: string,
    activeContentId: string,
    activeKeywordNormalized: string,
  ): Promise<void>
  pause(id: string): Promise<void>
}
