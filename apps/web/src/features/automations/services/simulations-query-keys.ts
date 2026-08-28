export const simulationsKeys = {
  all: ['simulations'] as const,
  executions: () => [...simulationsKeys.all, 'executions'] as const,
  execution: (executionId: string) => [...simulationsKeys.executions(), executionId] as const,
}
