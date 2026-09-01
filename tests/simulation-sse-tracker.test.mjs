import test from 'node:test'
import assert from 'node:assert/strict'
import { InMemorySimulationSseConnectionTracker } from '../apps/api/src/modules/simulations/infrastructure/security/in-memory-simulation-sse-connection-tracker.ts'

test('InMemorySimulationSseConnectionTracker limits concurrent connections per member/workspace', () => {
  const mockConfig = {
    get: (key) => {
      if (key === 'simulationSseMaxConcurrentPerMember') return 2
      if (key === 'simulationSseMaxConcurrentGlobal') return 10
      return undefined
    },
  }

  const tracker = new InMemorySimulationSseConnectionTracker(mockConfig)
  const scope1 = { organizationId: 'org-1', membershipId: 'mem-1', userId: 'user-1' }
  const scope2 = { organizationId: 'org-2', membershipId: 'mem-2', userId: 'user-2' }

  // 1. Acquire 2 slots for member 1 (up to limit)
  const lease1 = tracker.tryAcquire(scope1)
  assert.equal(lease1.acquired, true)
  const lease2 = tracker.tryAcquire(scope1)
  assert.equal(lease2.acquired, true)

  // 3rd attempt for member 1 is rejected with 'member_limit'
  const lease3 = tracker.tryAcquire(scope1)
  assert.equal(lease3.acquired, false)
  assert.equal(lease3.reason, 'member_limit')

  // Member 2 in another workspace can still acquire slots (isolated)
  const leaseOther = tracker.tryAcquire(scope2)
  assert.equal(leaseOther.acquired, true)

  // Releasing lease 1 frees a slot for member 1
  lease1.lease.release()
  // Double release is idempotent
  lease1.lease.release()

  const leaseRetry = tracker.tryAcquire(scope1)
  assert.equal(leaseRetry.acquired, true)

  // Cleanup
  lease2.lease.release()
  leaseOther.lease.release()
  leaseRetry.lease.release()

  const finalCounts = tracker.getActiveCounts()
  assert.equal(finalCounts.global, 0)
  assert.equal(finalCounts.perMember.size, 0)
})

test('InMemorySimulationSseConnectionTracker enforces global process connection limit', () => {
  const mockConfig = {
    get: (key) => {
      if (key === 'simulationSseMaxConcurrentPerMember') return 5
      if (key === 'simulationSseMaxConcurrentGlobal') return 2
      return undefined
    },
  }

  const tracker = new InMemorySimulationSseConnectionTracker(mockConfig)
  const scope1 = { organizationId: 'org-1', membershipId: 'mem-1', userId: 'user-1' }
  const scope2 = { organizationId: 'org-2', membershipId: 'mem-2', userId: 'user-2' }
  const scope3 = { organizationId: 'org-3', membershipId: 'mem-3', userId: 'user-3' }

  const lease1 = tracker.tryAcquire(scope1)
  assert.equal(lease1.acquired, true)
  const lease2 = tracker.tryAcquire(scope2)
  assert.equal(lease2.acquired, true)

  // 3rd global attempt is rejected with 'global_limit'
  const lease3 = tracker.tryAcquire(scope3)
  assert.equal(lease3.acquired, false)
  assert.equal(lease3.reason, 'global_limit')

  lease1.lease.release()
  const lease3Retry = tracker.tryAcquire(scope3)
  assert.equal(lease3Retry.acquired, true)

  lease2.lease.release()
  lease3Retry.lease.release()
  assert.equal(tracker.getActiveCounts().global, 0)
})
