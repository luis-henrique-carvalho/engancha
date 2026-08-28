import type { SimulationUpdatedEvent } from '@engancha/contracts'

export const SIMULATION_EVENTS_PUBLISHER = Symbol('SIMULATION_EVENTS_PUBLISHER')

export interface SimulationEventsPublisher {
  publish(event: SimulationUpdatedEvent): Promise<void>
}
