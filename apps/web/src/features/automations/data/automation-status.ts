import type { AutomationStatus } from '@engancha/contracts'

export interface AutomationStatusConfig {
  label: string
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
  description: string
}

export const AUTOMATION_STATUS_MAP: Record<AutomationStatus, AutomationStatusConfig> = {
  DRAFT: {
    label: 'Rascunho',
    variant: 'secondary',
    description: 'Em configuração, ainda não recebe comentários.',
  },
  ACTIVE: {
    label: 'Ativa',
    variant: 'default',
    description: 'Publicada e pronta para responder interações.',
  },
  PAUSED: {
    label: 'Pausada',
    variant: 'outline',
    description: 'Temporariamente desativada.',
  },
  ARCHIVED: {
    label: 'Arquivada',
    variant: 'destructive',
    description: 'Desativada permanentemente.',
  },
}
