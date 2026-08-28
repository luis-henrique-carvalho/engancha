import { Inject, Injectable } from '@nestjs/common'
import {
  getChannelCapabilities,
  matchesAutomationKeyword,
  type AutomationExecutionRequested,
  type AutomationSnapshot,
} from '@engancha/contracts'
import {
  AUTOMATION_EXECUTION_REPOSITORY,
  type AutomationExecutionOutputDraft,
  type AutomationExecutionRepository,
} from '../domain/ports/automation-execution-repository.port'
import type {
  AutomationExecutionConsumer,
  AutomationExecutionResult,
} from '../domain/ports/automation-execution-consumer.port'

@Injectable()
export class AutomationExecutionService implements AutomationExecutionConsumer {
  constructor(
    @Inject(AUTOMATION_EXECUTION_REPOSITORY)
    private readonly repository: AutomationExecutionRepository,
  ) {}

  async consume(message: AutomationExecutionRequested): Promise<AutomationExecutionResult> {
    const claim = await this.repository.claimExecution(message.executionId, message.organizationId)
    if (!claim) {
      return {
        executionId: message.executionId,
        status: 'SKIPPED',
      }
    }

    const candidates = await this.repository.findActiveCandidateAutomations(
      claim.organizationId,
      claim.contentId,
      claim.provider,
      claim.mode,
    )

    const matching = candidates.filter((candidate) =>
      matchesAutomationKeyword(claim.inputText, candidate.currentPublishedRevision.trigger.keyword),
    )

    if (matching.length === 0) {
      await this.repository.markIgnored({
        executionId: claim.id,
        organizationId: claim.organizationId,
        reason: 'Nenhuma automação ativa corresponde ao comentário',
      })

      return {
        executionId: claim.id,
        status: 'IGNORED',
        matched: false,
      }
    }

    if (matching.length > 1) {
      await this.repository.markFailed({
        executionId: claim.id,
        organizationId: claim.organizationId,
        errorCode: 'AMBIGUOUS_AUTOMATION_MATCH',
        errorMessage: 'Múltiplas automações ativas correspondem ao comentário',
      })

      return {
        executionId: claim.id,
        status: 'FAILED',
        matched: false,
        errorCode: 'AMBIGUOUS_AUTOMATION_MATCH',
      }
    }

    const matched = matching[0]
    const capabilities = getChannelCapabilities(claim.provider, claim.mode)
    const unsupported = matched.currentPublishedRevision.actions.find(
      (action) => !capabilities.supportedActions.includes(action.type as never),
    )

    if (unsupported) {
      await this.repository.markFailed({
        executionId: claim.id,
        organizationId: claim.organizationId,
        errorCode: 'UNSUPPORTED_CHANNEL_ACTION',
        errorMessage: `Ação ${unsupported.type} não suportada pelo canal ${claim.provider} (${claim.mode})`,
      })

      return {
        executionId: claim.id,
        status: 'FAILED',
        matched: true,
        errorCode: 'UNSUPPORTED_CHANNEL_ACTION',
      }
    }

    const snapshot: AutomationSnapshot = {
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
      actions: matched.currentPublishedRevision.actions.map((action) => ({
        position: action.position,
        type: action.type,
        config: action.config as Record<string, unknown>,
      })),
    }

    const outputs: AutomationExecutionOutputDraft[] = matched.currentPublishedRevision.actions
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((action) => {
        switch (action.type) {
          case 'PUBLIC_REPLY':
            return {
              key: `${claim.id}:${action.position}:PUBLIC_REPLY`,
              position: action.position,
              type: 'PUBLIC_REPLY',
              payload: {
                text: (action.config as { text: string }).text,
                simulated: true,
              },
            }
          case 'PRIVATE_REPLY':
            return {
              key: `${claim.id}:${action.position}:PRIVATE_REPLY`,
              position: action.position,
              type: 'PRIVATE_REPLY',
              payload: {
                text: (action.config as { text: string }).text,
                simulated: true,
              },
            }
          case 'LINK':
            return {
              key: `${claim.id}:${action.position}:LINK_DELIVERY`,
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
              key: `${claim.id}:${action.position}:EMAIL_CAPTURE_REQUEST`,
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

    await this.repository.saveExecutionCompleted({
      executionId: claim.id,
      organizationId: claim.organizationId,
      automationId: matched.id,
      revisionId: matched.currentPublishedRevision.id,
      snapshot,
      outputs,
    })

    return {
      executionId: claim.id,
      status: 'COMPLETED',
      matched: true,
      automationId: matched.id,
      revisionId: matched.currentPublishedRevision.id,
    }
  }
}
