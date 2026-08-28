import { Inject, Injectable, Optional } from '@nestjs/common'
import {
  SIMULATION_UPDATED_EVENT,
  getChannelCapabilities,
  matchesAutomationKeyword,
  type AutomationExecutionRequested,
  type AutomationSnapshot,
} from '@engancha/contracts'
import { WORKER_LOGGER } from '../../common/worker-logger.token'
import type { EventLogger } from '../../common/runtime-lifecycle.service'
import {
  AUTOMATION_EXECUTION_REPOSITORY,
  type AutomationExecutionOutputDraft,
  type AutomationExecutionRepository,
} from '../domain/ports/automation-execution-repository.port'
import {
  SIMULATION_EVENTS_PUBLISHER,
  type SimulationEventsPublisher,
} from '../domain/ports/simulation-events-publisher.port'
import type {
  AutomationExecutionConsumer,
  AutomationExecutionResult,
} from '../domain/ports/automation-execution-consumer.port'

@Injectable()
export class AutomationExecutionService implements AutomationExecutionConsumer {
  private readonly publisher: SimulationEventsPublisher
  private readonly logger: EventLogger

  constructor(
    @Inject(AUTOMATION_EXECUTION_REPOSITORY)
    private readonly repository: AutomationExecutionRepository,
    @Optional()
    @Inject(SIMULATION_EVENTS_PUBLISHER)
    publisher?: SimulationEventsPublisher,
    @Optional()
    @Inject(WORKER_LOGGER)
    logger?: EventLogger,
  ) {
    this.publisher = publisher ?? { publish: async () => {} }
    this.logger = logger ?? { event: () => {} }
  }

  async consume(message: AutomationExecutionRequested): Promise<AutomationExecutionResult> {
    const claim = await this.repository.claimExecution(message.executionId, message.organizationId)
    if (!claim) {
      this.logger.event('automation_execution_claim_skipped', {
        organizationId: message.organizationId,
        executionId: message.executionId,
        reason: 'Already claimed or terminal',
      })
      return { executionId: message.executionId, status: 'SKIPPED' }
    }

    this.logger.event('automation_execution_claimed', {
      organizationId: claim.organizationId,
      executionId: claim.id,
      provider: claim.provider,
      mode: claim.mode,
      attempts: claim.attempts,
    })

    const resolved = await this.resolveAutomationSnapshot(claim)
    if (!resolved.success) {
      return resolved.result
    }

    const { snapshot, automationId, revisionId } = resolved
    const outputs = this.generateExecutionOutputs(claim.id, snapshot.actions)

    this.logger.event('automation_execution_outputs_generated', {
      organizationId: claim.organizationId,
      executionId: claim.id,
      outputsCount: outputs.length,
    })

    return this.completeExecution({
      claim,
      automationId,
      revisionId,
      snapshot,
      outputs,
    })
  }

  private async resolveAutomationSnapshot(
    claim: any,
  ): Promise<
    | { success: true; snapshot: AutomationSnapshot; automationId: string; revisionId: string }
    | { success: false; result: AutomationExecutionResult }
  > {
    if (claim.automationSnapshot && claim.automationId && claim.automationRevisionId) {
      this.logger.event('automation_execution_snapshot_reused', {
        organizationId: claim.organizationId,
        executionId: claim.id,
        automationId: claim.automationId,
        revisionId: claim.automationRevisionId,
      })

      return {
        success: true,
        snapshot: claim.automationSnapshot,
        automationId: claim.automationId,
        revisionId: claim.automationRevisionId,
      }
    }

    const candidates = await this.repository.findActiveCandidateAutomations(
      claim.organizationId,
      claim.contentId,
      claim.provider,
      claim.mode,
    )

    this.logger.event('automation_execution_matching_started', {
      organizationId: claim.organizationId,
      executionId: claim.id,
      candidatesCount: candidates.length,
    })

    const matching = candidates.filter((candidate) =>
      matchesAutomationKeyword(claim.inputText, candidate.currentPublishedRevision.trigger.keyword),
    )

    if (matching.length === 0) {
      return { success: false, result: await this.handleNoMatch(claim) }
    }

    if (matching.length > 1) {
      return { success: false, result: await this.handleAmbiguousMatch(claim, matching.length) }
    }

    const matched = matching[0]
    const capabilities = getChannelCapabilities(claim.provider, claim.mode)
    const unsupported = matched.currentPublishedRevision.actions.find(
      (action) => !capabilities.supportedActions.includes(action.type as never),
    )

    if (unsupported) {
      return {
        success: false,
        result: await this.handleUnsupportedAction(claim, unsupported.type),
      }
    }

    const snapshot = this.buildAutomationSnapshot(matched)

    this.logger.event('automation_execution_matched', {
      organizationId: claim.organizationId,
      executionId: claim.id,
      automationId: matched.id,
      revisionId: matched.currentPublishedRevision.id,
      version: snapshot.version,
    })

    return {
      success: true,
      snapshot,
      automationId: matched.id,
      revisionId: matched.currentPublishedRevision.id,
    }
  }

  private buildAutomationSnapshot(matched: any): AutomationSnapshot {
    return {
      automationId: matched.id,
      revisionId: matched.currentPublishedRevision.id,
      version: matched.currentPublishedRevision.version,
      target: {
        contentId: matched.currentPublishedRevision.target.contentId,
      },
      trigger: {
        type: matched.currentPublishedRevision.trigger.type,
        keyword: matched.currentPublishedRevision.trigger.keyword,
        keywordNormalized: matched.currentPublishedRevision.trigger.keywordNormalized,
      },
      actions: matched.currentPublishedRevision.actions.map((action: any) => ({
        position: action.position,
        type: action.type,
        config: action.config as Record<string, unknown>,
      })),
    }
  }

  private async handleNoMatch(claim: any): Promise<AutomationExecutionResult> {
    await this.repository.markIgnored({
      executionId: claim.id,
      organizationId: claim.organizationId,
      reason: 'Nenhuma automação ativa corresponde ao comentário',
    })

    await this.publisher.publish({
      type: SIMULATION_UPDATED_EVENT,
      version: 'v1',
      executionId: claim.id,
      organizationId: claim.organizationId,
      stateVersion: 2,
      status: 'IGNORED',
      timestamp: new Date().toISOString(),
    })

    this.logger.event('automation_execution_ignored', {
      organizationId: claim.organizationId,
      executionId: claim.id,
      reason: 'No active automation matched keyword',
    })

    return {
      executionId: claim.id,
      status: 'IGNORED',
      matched: false,
    }
  }

  private async handleAmbiguousMatch(
    claim: any,
    matchingCount: number,
  ): Promise<AutomationExecutionResult> {
    await this.repository.markFailed({
      executionId: claim.id,
      organizationId: claim.organizationId,
      errorCode: 'AMBIGUOUS_AUTOMATION_MATCH',
      errorMessage: 'Múltiplas automações ativas correspondem ao comentário',
      matched: false,
    })

    await this.publisher.publish({
      type: SIMULATION_UPDATED_EVENT,
      version: 'v1',
      executionId: claim.id,
      organizationId: claim.organizationId,
      stateVersion: 2,
      status: 'FAILED',
      timestamp: new Date().toISOString(),
    })

    this.logger.event('automation_execution_ambiguous_match', {
      organizationId: claim.organizationId,
      executionId: claim.id,
      matchingCount,
    })

    return {
      executionId: claim.id,
      status: 'FAILED',
      matched: false,
      errorCode: 'AMBIGUOUS_AUTOMATION_MATCH',
    }
  }

  private async handleUnsupportedAction(
    claim: any,
    actionType: string,
  ): Promise<AutomationExecutionResult> {
    await this.repository.markFailed({
      executionId: claim.id,
      organizationId: claim.organizationId,
      errorCode: 'UNSUPPORTED_CHANNEL_ACTION',
      errorMessage: `Ação ${actionType} não suportada pelo canal ${claim.provider} (${claim.mode})`,
      matched: true,
    })

    await this.publisher.publish({
      type: SIMULATION_UPDATED_EVENT,
      version: 'v1',
      executionId: claim.id,
      organizationId: claim.organizationId,
      stateVersion: 2,
      status: 'FAILED',
      timestamp: new Date().toISOString(),
    })

    this.logger.event('automation_execution_unsupported_action', {
      organizationId: claim.organizationId,
      executionId: claim.id,
      actionType,
      provider: claim.provider,
      mode: claim.mode,
    })

    return {
      executionId: claim.id,
      status: 'FAILED',
      matched: true,
      errorCode: 'UNSUPPORTED_CHANNEL_ACTION',
    }
  }

  private generateExecutionOutputs(
    claimId: string,
    actions: AutomationSnapshot['actions'],
  ): AutomationExecutionOutputDraft[] {
    return actions
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((action) => {
        switch (action.type) {
          case 'PUBLIC_REPLY':
            return {
              key: `${claimId}:${action.position}:PUBLIC_REPLY`,
              position: action.position,
              type: 'PUBLIC_REPLY',
              payload: {
                text: (action.config as { text: string }).text,
                simulated: true,
              },
            }
          case 'PRIVATE_REPLY':
            return {
              key: `${claimId}:${action.position}:PRIVATE_REPLY`,
              position: action.position,
              type: 'PRIVATE_REPLY',
              payload: {
                text: (action.config as { text: string }).text,
                simulated: true,
              },
            }
          case 'LINK':
            return {
              key: `${claimId}:${action.position}:LINK_DELIVERY`,
              position: action.position,
              type: 'LINK_DELIVERY',
              payload: {
                url: (action.config as { url: string }).url,
                label: (action.config as { label?: string }).label ?? 'Abrir link',
                simulated: true,
              },
            }
          case 'CAPTURE_EMAIL':
            return {
              key: `${claimId}:${action.position}:EMAIL_CAPTURE_REQUEST`,
              position: action.position,
              type: 'EMAIL_CAPTURE_REQUEST',
              payload: {
                prompt: (action.config as { prompt: string }).prompt,
                simulated: true,
              },
            }
          default:
            throw new Error(`Tipo de ação não suportado: ${action.type}`)
        }
      })
  }

  private async completeExecution(params: {
    claim: any
    automationId: string
    revisionId: string
    snapshot: AutomationSnapshot
    outputs: AutomationExecutionOutputDraft[]
  }): Promise<AutomationExecutionResult> {
    const { claim, automationId, revisionId, snapshot, outputs } = params

    await this.repository.saveExecutionCompleted({
      executionId: claim.id,
      organizationId: claim.organizationId,
      automationId,
      revisionId,
      snapshot,
      outputs,
    })

    await this.publisher.publish({
      type: SIMULATION_UPDATED_EVENT,
      version: 'v1',
      executionId: claim.id,
      organizationId: claim.organizationId,
      stateVersion: 3,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
    })

    this.logger.event('automation_execution_completed', {
      organizationId: claim.organizationId,
      executionId: claim.id,
      automationId,
      revisionId,
      outputsCount: outputs.length,
      stateVersion: 3,
    })

    return {
      executionId: claim.id,
      status: 'COMPLETED',
      matched: true,
      automationId,
      revisionId,
    }
  }

  async handleJobFailure(params: {
    executionId: string
    organizationId: string
    attemptsMade: number
    maxAttempts: number
    error: Error
  }): Promise<void> {
    if (params.attemptsMade < params.maxAttempts) {
      await this.repository.recordAttemptFailure({
        executionId: params.executionId,
        organizationId: params.organizationId,
        attemptsMade: params.attemptsMade,
      })

      this.logger.event('automation_execution_attempt_recorded', {
        organizationId: params.organizationId,
        executionId: params.executionId,
        attemptsMade: params.attemptsMade,
        maxAttempts: params.maxAttempts,
      })
    } else {
      await this.repository.markFailed({
        executionId: params.executionId,
        organizationId: params.organizationId,
        errorCode: 'EXECUTION_FAILED',
        errorMessage: 'Falha ao processar execução',
      })

      await this.publisher.publish({
        type: SIMULATION_UPDATED_EVENT,
        version: 'v1',
        executionId: params.executionId,
        organizationId: params.organizationId,
        stateVersion: 2,
        status: 'FAILED',
        timestamp: new Date().toISOString(),
      })

      this.logger.event('automation_execution_failed_terminal', {
        organizationId: params.organizationId,
        executionId: params.executionId,
        errorCode: 'EXECUTION_FAILED',
        reason: params.error.message,
      })
    }
  }
}
