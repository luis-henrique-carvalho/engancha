export const SIMULATION_SSE_CONNECTION_TRACKER = Symbol('SIMULATION_SSE_CONNECTION_TRACKER')

export interface SimulationSseLease {
  readonly id: string
  release(): void
}

export type SimulationSseAcquireResult =
  | { readonly acquired: true; readonly lease: SimulationSseLease }
  | { readonly acquired: false; readonly reason: 'member_limit' | 'global_limit' }

export interface SimulationSseConnectionTracker {
  tryAcquire(scope: {
    organizationId: string
    membershipId: string
    userId?: string
  }): SimulationSseAcquireResult

  getActiveCounts(): {
    global: number
    perMember: Map<string, number>
  }
}
