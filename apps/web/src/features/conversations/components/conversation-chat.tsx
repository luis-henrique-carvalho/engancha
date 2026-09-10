import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ConversationDetailResponse, ConversationMessage } from '@engancha/contracts'
import { ArrowDownLeft, ArrowUpRight, ExternalLink, Mail } from 'lucide-react'
import { ConversationContactCard, ConversationEmailCapturesCard } from './conversation-detail-cards'

type Props = {
  conversation: ConversationDetailResponse
}

function renderMessageLabel(type: ConversationMessage['type']) {
  switch (type) {
    case 'COMMENT':
      return 'Comentário público'
    case 'PUBLIC_REPLY':
      return 'Resposta pública'
    case 'PRIVATE_REPLY':
      return 'Resposta no Direct'
    case 'DIRECT_MESSAGE':
      return 'Mensagem direta'
    case 'DIRECT_MESSAGE_WITH_LINK':
      return 'Mensagem com link'
    case 'EMAIL_CAPTURE_REQUEST':
      return 'Solicitação de e-mail'
    case 'INCOMING_MESSAGE':
      return 'Resposta do seguidor'
    default:
      return type
  }
}

function ConversationMessageItem({
  msg,
  contactName,
  automationName,
}: {
  msg: ConversationMessage
  contactName: string
  automationName?: string | null
}) {
  const isInbound = msg.direction === 'INBOUND'

  return (
    <div className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
        {isInbound ? (
          <>
            <ArrowDownLeft className="size-3 text-blue-500" />
            <span>{contactName}</span>
          </>
        ) : (
          <>
            <ArrowUpRight className="size-3 text-emerald-500" />
            <span>{automationName ?? 'Automação Engancha'}</span>
          </>
        )}
        <span>•</span>
        <span>{renderMessageLabel(msg.type)}</span>
        <span>•</span>
        <span>
          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <div
        className={`max-w-[80%] rounded-lg p-3 text-sm shadow-sm ${
          isInbound ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
        }`}
      >
        <p className="whitespace-pre-wrap">{msg.text ?? 'Conteúdo interativo'}</p>

        {msg.type === 'DIRECT_MESSAGE_WITH_LINK' && (
          <div
            className={`mt-2 pt-2 border-t flex items-center gap-1.5 text-xs ${
              isInbound ? 'border-border/60' : 'border-primary-foreground/30'
            }`}
          >
            <ExternalLink className="size-3.5" />
            <span className="font-medium">Link compartilhado com o contato</span>
          </div>
        )}

        {msg.type === 'EMAIL_CAPTURE_REQUEST' && (
          <div
            className={`mt-2 pt-2 border-t flex items-center gap-1.5 text-xs ${
              isInbound ? 'border-border/60' : 'border-primary-foreground/30'
            }`}
          >
            <Mail className="size-3.5" />
            <span className="font-medium">Solicitação de captura de e-mail enviada</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function ConversationChat({ conversation }: Props) {
  const { contact, messages, lead, emailCaptures, provider, mode } = conversation
  const contactName = contact.username ? `@${contact.username}` : (contact.name ?? 'Contato')

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                {contactName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-base font-medium">{contactName}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{provider}</span>
                  {mode === 'SIMULATED' && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] py-0 px-1"
                    >
                      Simulado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {lead && (
              <Badge
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700 text-xs"
              >
                Lead Ativo
              </Badge>
            )}
          </CardHeader>

          <CardContent className="p-4 sm:p-6 flex flex-col gap-4 min-h-[400px]">
            {messages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground italic">
                Nenhuma mensagem registrada nesta conversa.
              </div>
            ) : (
              messages.map((msg) => (
                <ConversationMessageItem
                  key={msg.id}
                  msg={msg}
                  contactName={contactName}
                  automationName={conversation.automation?.name}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <ConversationContactCard conversation={conversation} />
        <ConversationEmailCapturesCard captures={emailCaptures} />
      </div>
    </div>
  )
}
