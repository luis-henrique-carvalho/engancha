export const simulationsKeys = {
  all: ['simulations'] as const,
  executions: () => [...simulationsKeys.all, 'executions'] as const,
  list: (automationId?: string) =>
    [...simulationsKeys.executions(), 'list', { automationId }] as const,
  execution: (executionId: string) => [...simulationsKeys.executions(), executionId] as const,
}
