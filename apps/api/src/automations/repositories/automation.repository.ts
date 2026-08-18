import type { CreateAutomationRequest, PaginationRequest } from '@engancha/contracts'
export const AUTOMATION_REPOSITORY = Symbol('AUTOMATION_REPOSITORY')
export interface AutomationRepository {
  list(organizationId: string, input: PaginationRequest): Promise<{ items: any[]; total: number }>
  create(organizationId: string, userId: string, input: CreateAutomationRequest): Promise<any>
  find(id: string, organizationId: string): Promise<any | null>
  transaction(work: (database: any) => Promise<any>): Promise<any>
}
