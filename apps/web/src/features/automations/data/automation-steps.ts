import type { LucideIcon } from 'lucide-react'
import { CheckCircle2, Hash, Image, Link, MessageSquare, Send, Tag } from 'lucide-react'

export interface AutomationStepItem {
  id: string
  title: string
  shortTitle: string
  description: string
  path: string
  icon: LucideIcon
}

export const AUTOMATION_STEPS: AutomationStepItem[] = [
  {
    id: 'identification',
    title: '1. Identificação',
    shortTitle: 'Identificação',
    description: 'Defina o nome da automação para organização interna.',
    path: 'identification',
    icon: Tag,
  },
  {
    id: 'content',
    title: '2. Conteúdo',
    shortTitle: 'Conteúdo',
    description: 'Selecione a publicação ou reel do Instagram associado.',
    path: 'content',
    icon: Image,
  },
  {
    id: 'keyword',
    title: '3. Palavra-chave',
    shortTitle: 'Palavra-chave',
    description: 'Configure o gatilho textual que aciona a resposta.',
    path: 'keyword',
    icon: Hash,
  },
  {
    id: 'public-reply',
    title: '4. Resposta pública',
    shortTitle: 'Resposta pública',
    description: 'Defina o comentário de resposta visível no post.',
    path: 'public-reply',
    icon: MessageSquare,
  },
  {
    id: 'direct-message',
    title: '5. Mensagem direta (DM)',
    shortTitle: 'Mensagem direta',
    description: 'Defina o texto enviado diretamente no direct.',
    path: 'direct-message',
    icon: Send,
  },
  {
    id: 'final-action',
    title: '6. Ação final',
    shortTitle: 'Ação final',
    description: 'Configure o link de destino ou captura de e-mail.',
    path: 'final-action',
    icon: Link,
  },
  {
    id: 'review',
    title: '7. Revisão e publicação',
    shortTitle: 'Revisão',
    description: 'Valide a integridade do fluxo e publique a automação.',
    path: 'review',
    icon: CheckCircle2,
  },
]
