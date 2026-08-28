import { Inject, Injectable } from '@nestjs/common'
import type { AutomationSnapshot } from '@engancha/contracts'
import { PrismaService } from '../../../platform/database/prisma.service'
import type {
  AutomationExecutionRepository,
  CandidateAutomation,
  ClaimedExecution,
} from '../../domain/ports/automation-execution-repository.port'

@Injectable()
export class PrismaAutomationExecutionRepository implements AutomationExecutionRepository {
  constructor(@Inject(PrismaService) private readonly database: PrismaService) {}

  async claimExecution(
    executionId: string,
    organizationId: string,
  ): Promise<ClaimedExecution | null> {
    const updated = await this.database.client.automationExecution.updateMany({
      where: {
        id: executionId,
        organizationId,
        status: 'PENDING',
      },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        attempts: { increment: 1 },
        stateVersion: { increment: 1 },
      },
    })

    if (updated.count === 0) {
      return null
    }

    const execution = await this.database.client.automationExecution.findUniqueOrThrow({
      where: { id: executionId },
      select: {
        id: true,
        organizationId: true,
        contentId: true,
        provider: true,
        mode: true,
        inputText: true,
        inputAuthor: true,
        commentId: true,
        originAutomationId: true,
        automationId: true,
        automationRevisionId: true,
        automationSnapshot: true,
        status: true,
        attempts: true,
        stateVersion: true,
      },
    })

    return execution as ClaimedExecution
  }

  async findActiveCandidateAutomations(
    organizationId: string,
    contentId: string,
    provider: string,
    mode: string,
  ): Promise<CandidateAutomation[]> {
    const automations = await this.database.client.automation.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        currentPublishedRevisionId: { not: null },
        currentPublishedRevision: {
          target: {
            contentId,
            content: {
              provider: provider as never,
              mode: mode as never,
            },
          },
        },
      },
      include: {
        currentPublishedRevision: {
          include: {
            target: true,
            trigger: true,
            actions: { orderBy: { position: 'asc' } },
          },
        },
      },
    })

    return automations
      .filter(
        (
          auto,
        ): auto is typeof auto & {
          currentPublishedRevision: NonNullable<typeof auto.currentPublishedRevision> & {
            target: NonNullable<NonNullable<typeof auto.currentPublishedRevision>['target']>
            trigger: NonNullable<NonNullable<typeof auto.currentPublishedRevision>['trigger']>
          }
        } =>
          auto.currentPublishedRevision !== null &&
          auto.currentPublishedRevision.target !== null &&
          auto.currentPublishedRevision.trigger !== null,
      )
      .map((auto) => ({
        id: auto.id,
        organizationId: auto.organizationId,
        status: auto.status,
        currentPublishedRevision: {
          id: auto.currentPublishedRevision.id,
          version: auto.currentPublishedRevision.version,
          target: {
            id: auto.currentPublishedRevision.target.id,
            contentId: auto.currentPublishedRevision.target.contentId,
          },
          trigger: {
            id: auto.currentPublishedRevision.trigger.id,
            type: auto.currentPublishedRevision.trigger.type,
            keyword: auto.currentPublishedRevision.trigger.keyword,
            keywordNormalized: auto.currentPublishedRevision.trigger.keywordNormalized,
          },
          actions: auto.currentPublishedRevision.actions.map((action) => ({
            id: action.id,
            position: action.position,
            type: action.type,
            config: action.config as Record<string, unknown>,
          })),
        },
      }))
  }

  async saveMatchSnapshot(params: {
    executionId: string
    organizationId: string
    automationId: string
    revisionId: string
    snapshot: AutomationSnapshot
  }): Promise<void> {
    await this.database.client.automationExecution.update({
      where: { id: params.executionId },
      data: {
        automationId: params.automationId,
        automationRevisionId: params.revisionId,
        automationSnapshot: params.snapshot as never,
        matched: true,
        stateVersion: { increment: 1 },
      },
    })
  }

  async saveExecutionCompleted(params: {
    executionId: string
    organizationId: string
    automationId: string
    revisionId: string
    snapshot: AutomationSnapshot
    outputs: Array<{
      key: string
      position: number
      type: 'PUBLIC_REPLY' | 'PRIVATE_REPLY' | 'LINK_DELIVERY' | 'EMAIL_CAPTURE_REQUEST'
      payload: Record<string, unknown>
    }>
  }): Promise<void> {
    await this.database.client.$transaction(async (tx) => {
      await tx.automationExecution.update({
        where: { id: params.executionId },
        data: {
          automationId: params.automationId,
          automationRevisionId: params.revisionId,
          automationSnapshot: params.snapshot as never,
          matched: true,
          status: 'COMPLETED',
          completedAt: new Date(),
          stateVersion: { increment: 1 },
        },
      })

      for (const output of params.outputs) {
        await tx.automationExecutionOutput.upsert({
          where: {
            executionId_key: {
              executionId: params.executionId,
              key: output.key,
            },
          },
          create: {
            executionId: params.executionId,
            key: output.key,
            position: output.position,
            type: output.type,
            payload: output.payload as never,
          },
          update: {
            position: output.position,
            type: output.type,
            payload: output.payload as never,
          },
        })
      }
    })
  }

  async recordAttemptFailure(params: {
    executionId: string
    organizationId: string
    attemptsMade: number
  }): Promise<void> {
    await this.database.client.automationExecution.updateMany({
      where: {
        id: params.executionId,
        organizationId: params.organizationId,
        status: 'PROCESSING',
      },
      data: {
        status: 'PENDING',
        stateVersion: { increment: 1 },
      },
    })
  }

  async markIgnored(params: {
    executionId: string
    organizationId: string
    reason: string
  }): Promise<void> {
    await this.database.client.automationExecution.update({
      where: { id: params.executionId },
      data: {
        status: 'IGNORED',
        matched: false,
        completedAt: new Date(),
        errorMessage: params.reason,
        stateVersion: { increment: 1 },
      },
    })
  }

  async markFailed(params: {
    executionId: string
    organizationId: string
    errorCode: string
    errorMessage: string
    matched?: boolean
  }): Promise<void> {
    await this.database.client.automationExecution.update({
      where: { id: params.executionId },
      data: {
        status: 'FAILED',
        ...(params.matched !== undefined ? { matched: params.matched } : {}),
        completedAt: new Date(),
        errorCode: params.errorCode,
        errorMessage: params.errorMessage,
        stateVersion: { increment: 1 },
      },
    })
  }
}

