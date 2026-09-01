import { randomUUID } from 'node:crypto'
import { Inject, Injectable, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type {
  SimulationSseAcquireResult,
  SimulationSseConnectionTracker,
  SimulationSseLease,
} from '../../domain/ports/simulation-sse-connection-tracker.port'

@Injectable()
export class InMemorySimulationSseConnectionTracker implements SimulationSseConnectionTracker {
  private readonly maxConcurrentPerMember: number
  private readonly maxConcurrentGlobal: number
  private globalCount = 0
  private readonly memberCounts = new Map<string, number>()

  constructor(@Optional() @Inject(ConfigService) config?: ConfigService) {
    this.maxConcurrentPerMember = config?.get<number>('simulationSseMaxConcurrentPerMember') ?? 5
    this.maxConcurrentGlobal = config?.get<number>('simulationSseMaxConcurrentGlobal') ?? 100
  }

  tryAcquire(scope: {
    organizationId: string
    membershipId: string
    userId?: string
  }): SimulationSseAcquireResult {
    if (this.globalCount >= this.maxConcurrentGlobal) {
      return { acquired: false, reason: 'global_limit' }
    }

    const memberKey = `${scope.organizationId}:${scope.membershipId}`
    const currentMemberCount = this.memberCounts.get(memberKey) ?? 0

    if (currentMemberCount >= this.maxConcurrentPerMember) {
      return { acquired: false, reason: 'member_limit' }
    }

    this.globalCount += 1
    this.memberCounts.set(memberKey, currentMemberCount + 1)

    const leaseId = randomUUID()
    let isReleased = false

    const lease: SimulationSseLease = {
      id: leaseId,
      release: () => {
        if (isReleased) {
          return
        }
        isReleased = true

        this.globalCount = Math.max(0, this.globalCount - 1)
        const updated = (this.memberCounts.get(memberKey) ?? 1) - 1
        if (updated <= 0) {
          this.memberCounts.delete(memberKey)
        } else {
          this.memberCounts.set(memberKey, updated)
        }
      },
    }

    return { acquired: true, lease }
  }

  getActiveCounts(): {
    global: number
    perMember: Map<string, number>
  } {
    return {
      global: this.globalCount,
      perMember: new Map(this.memberCounts),
    }
  }
}
