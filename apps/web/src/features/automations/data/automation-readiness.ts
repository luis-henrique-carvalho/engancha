import type { AutomationResponse } from '@engancha/contracts'
import {
  getFinalAction,
  getPrivateReplyText,
  getPublicReplyText,
} from './automation-action-mappers'

export type AutomationStepId =
  | 'identification'
  | 'content'
  | 'keyword'
  | 'public-reply'
  | 'direct-message'
  | 'final-action'

export interface AutomationReadinessItem {
  id: AutomationStepId
  stepNumber: number
  title: string
  shortTitle: string
  description: string
  isComplete: boolean
  valueSummary: string
  field: 'name' | 'targetId' | 'keyword' | 'actions'
}

export interface AutomationReadinessResult {
  items: AutomationReadinessItem[]
  completedCount: number
  totalCount: number
  isReady: boolean
}

export function getAutomationReadiness(
  automation: AutomationResponse | null | undefined,
): AutomationReadinessResult {
  const current = automation?.current ?? automation?.draft ?? null
  const actions = current?.actions ?? []

  const hasName = Boolean(current?.name?.trim())
  const hasTarget = Boolean(current?.target?.id)
  const hasKeyword = Boolean(current?.keyword?.trim())
  const publicReplyText = getPublicReplyText(actions).trim()
  const hasPublicReply = Boolean(publicReplyText)
  const privateReplyText = getPrivateReplyText(actions).trim()
  const hasPrivateReply = Boolean(privateReplyText)
  const finalAction = getFinalAction(actions)
  const hasFinalAction = Boolean(finalAction)

  let finalActionSummary = 'Nenhuma ação final configurada'
  if (finalAction?.type === 'LINK') {
    finalActionSummary = `Link: ${finalAction.url} (${finalAction.label || 'Abrir link'})`
  } else if (finalAction?.type === 'CAPTURE_EMAIL') {
    finalActionSummary = `Captura de e-mail: "${finalAction.prompt}"`
  }

  const items: AutomationReadinessItem[] = [
    {
      id: 'identification',
      stepNumber: 1,
      title: 'Nome da automação',
      shortTitle: 'Identificação',
      description: 'Nome amigável para organização interna.',
      isComplete: hasName,
      valueSummary: current?.name?.trim() || 'Não informado',
      field: 'name',
    },
    {
      id: 'content',
      stepNumber: 2,
      title: 'Conteúdo associado',
      shortTitle: 'Conteúdo',
      description: 'Publicação ou vídeo do Instagram associado.',
      isComplete: hasTarget,
      valueSummary: current?.target?.title || 'Nenhum conteúdo selecionado',
      field: 'targetId',
    },
    {
      id: 'keyword',
      stepNumber: 3,
      title: 'Palavra-chave do gatilho',
      shortTitle: 'Palavra-chave',
      description: 'Gatilho textual que aciona o fluxo.',
      isComplete: hasKeyword,
      valueSummary: current?.keyword?.trim()
        ? `Gatilho: "${current.keyword.trim()}"`
        : 'Nenhuma palavra-chave configurada',
      field: 'keyword',
    },
    {
      id: 'public-reply',
      stepNumber: 4,
      title: 'Resposta pública',
      shortTitle: 'Resposta pública',
      description: 'Comentário visível de resposta no post.',
      isComplete: hasPublicReply,
      valueSummary: publicReplyText || 'Nenhuma resposta pública configurada',
      field: 'actions',
    },
    {
      id: 'direct-message',
      stepNumber: 5,
      title: 'Mensagem direta (DM)',
      shortTitle: 'Mensagem direta',
      description: 'Texto enviado diretamente no direct.',
      isComplete: hasPrivateReply,
      valueSummary: privateReplyText || 'Nenhuma mensagem direta configurada',
      field: 'actions',
    },
    {
      id: 'final-action',
      stepNumber: 6,
      title: 'Ação final',
      shortTitle: 'Ação final',
      description: 'Link de destino ou captura de e-mail.',
      isComplete: hasFinalAction,
      valueSummary: finalActionSummary,
      field: 'actions',
    },
  ]

  const completedCount = items.filter((item) => item.isComplete).length
  const totalCount = items.length
  const isReady = completedCount === totalCount

  return {
    items,
    completedCount,
    totalCount,
    isReady,
  }
}
