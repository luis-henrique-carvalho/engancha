import type { SimulationExecutionResponse } from '@engancha/contracts'

export interface ActivityGroup {
  dateLabel: string
  executions: SimulationExecutionResponse[]
}

export function formatActivityDate(dateString?: string): string {
  if (!dateString) return 'Data recente'

  try {
    const date = new Date(dateString)
    const now = new Date()

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()

    if (isToday) {
      return 'Hoje'
    }

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()

    if (isYesterday) {
      return 'Ontem'
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return 'Data recente'
  }
}

export function formatActivityTime(dateString?: string): string {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return ''
  }
}

export function groupExecutionsByDate(executions: SimulationExecutionResponse[]): ActivityGroup[] {
  const groupsMap = new Map<string, SimulationExecutionResponse[]>()

  for (const item of executions) {
    const label = formatActivityDate(item.createdAt || item.input?.submittedAt)
    const existing = groupsMap.get(label)
    if (existing) {
      existing.push(item)
    } else {
      groupsMap.set(label, [item])
    }
  }

  const groups: ActivityGroup[] = []
  for (const [dateLabel, items] of groupsMap.entries()) {
    groups.push({
      dateLabel,
      executions: items,
    })
  }

  return groups
}

export interface MatchDescription {
  type: 'matched' | 'unmatched' | 'other-matched' | 'failed' | 'processing' | 'pending'
  label: string
  description: string
}

export function getAutomationMatchDescription(
  execution: SimulationExecutionResponse,
  currentAutomationId?: string,
): MatchDescription {
  if (execution.status === 'FAILED') {
    return {
      type: 'failed',
      label: 'Falha na simulação',
      description: execution.error?.message || 'A simulação não pôde ser concluída.',
    }
  }

  if (execution.status === 'IGNORED' || execution.matched === false) {
    return {
      type: 'unmatched',
      label: 'Sem correspondência',
      description: 'Nenhuma regra ativa reconheceu a palavra-chave para esta publicação.',
    }
  }

  if (execution.status === 'PROCESSING') {
    return {
      type: 'processing',
      label: 'Processando',
      description: 'Analisando comentário e preparando respostas...',
    }
  }

  if (execution.status === 'PENDING') {
    return {
      type: 'pending',
      label: 'Aguardando',
      description: 'Comentário recebido na fila de simulação.',
    }
  }

  if (execution.automation) {
    if (currentAutomationId && execution.automation.id !== currentAutomationId) {
      return {
        type: 'other-matched',
        label: `Correspondência: ${execution.automation.name || 'Outra automação'}`,
        description: `Esta publicação acionou a automação "${execution.automation.name || execution.automation.id}".`,
      }
    }

    return {
      type: 'matched',
      label: execution.automation.name
        ? `Automação: ${execution.automation.name}`
        : 'Automação correspondente',
      description: 'Gatilho reconhecido com sucesso.',
    }
  }

  return {
    type: 'unmatched',
    label: 'Sem correspondência',
    description: 'Nenhuma regra ativa reconheceu a palavra-chave.',
  }
}
