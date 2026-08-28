import { Inject, Injectable } from '@nestjs/common'
import {
  matchesAutomationKeyword,
  type AutomationExecutionRequested,
  type AutomationSnapshot,
} from '@engancha/contracts'
import {
  AUTOMATION_EXECUTION_REPOSITORY,
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

    await this.repository.saveMatchSnapshot({
      executionId: claim.id,
      organizationId: claim.organizationId,
      automationId: matched.id,
      revisionId: matched.currentPublishedRevision.id,
      snapshot,
    })

    return {
      executionId: claim.id,
      status: 'PROCESSING',
      matched: true,
      automationId: matched.id,
      revisionId: matched.currentPublishedRevision.id,
    }
  }
}
