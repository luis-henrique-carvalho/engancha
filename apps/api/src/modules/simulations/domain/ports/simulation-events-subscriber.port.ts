import type { SimulationUpdatedEvent } from '@engancha/contracts'

export const SIMULATION_EVENTS_SUBSCRIBER = Symbol('SIMULATION_EVENTS_SUBSCRIBER')

export interface SimulationEventsSubscriber {
  subscribe(
    executionId: string,
    onEvent: (event: SimulationUpdatedEvent) => void | Promise<void>,
  ): Promise<() => Promise<void>>
}
