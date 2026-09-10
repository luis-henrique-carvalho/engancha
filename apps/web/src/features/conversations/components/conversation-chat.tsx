import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ConversationDetailResponse, ConversationMessage } from '@engancha/contracts'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  Tag as TagIcon,
  User,
} from 'lucide-react'

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

export function ConversationChat({ conversation }: Props) {
  const { contact, messages, tags, lead, emailCaptures, provider, mode } = conversation
  const contactName = contact.username ? `@${contact.username}` : (contact.name ?? 'Contato')

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Coluna do Histórico */}
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
              messages.map((msg) => {
                const isInbound = msg.direction === 'INBOUND'
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                      {isInbound ? (
                        <>
                          <ArrowDownLeft className="size-3 text-blue-500" />
                          <span>{contactName}</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="size-3 text-emerald-500" />
                          <span>{conversation.automation?.name ?? 'Automação Engancha'}</span>
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
                        isInbound
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text ?? 'Conteúdo interativo'}</p>

                      {/* Exibição amigável de links sem infra-leak */}
                      {msg.type === 'DIRECT_MESSAGE_WITH_LINK' && (
                        <div
                          className={`mt-2 pt-2 border-t flex items-center gap-1.5 text-xs ${isInbound ? 'border-border/60' : 'border-primary-foreground/30'}`}
                        >
                          <ExternalLink className="size-3.5" />
                          <span className="font-medium">Link compartilhado com o contato</span>
                        </div>
                      )}

                      {/* Exibição amigável de solicitação de e-mail */}
                      {msg.type === 'EMAIL_CAPTURE_REQUEST' && (
                        <div
                          className={`mt-2 pt-2 border-t flex items-center gap-1.5 text-xs ${isInbound ? 'border-border/60' : 'border-primary-foreground/30'}`}
                        >
                          <Mail className="size-3.5" />
                          <span className="font-medium">
                            Solicitação de captura de e-mail enviada
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coluna Lateral: Resumo do Contato e Captura */}
      <div className="space-y-4">
        {/* Card do Contato */}
        <Card>
          <CardHeader className="py-4 px-6 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="size-4" />
              Identidade do Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Identificador social</span>
              <span className="font-medium text-foreground">{contactName}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">E-mail verificado</span>
              <span className="font-medium text-foreground">
                {contact.email ?? (
                  <span className="text-muted-foreground italic">Não fornecido</span>
                )}
              </span>
            </div>
            {contact.name && (
              <div>
                <span className="text-xs text-muted-foreground block">Nome exibido</span>
                <span className="font-medium text-foreground">{contact.name}</span>
              </div>
            )}
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Tags associadas</span>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <Badge
                      key={t.id}
                      variant="secondary"
                      className="text-xs gap-1"
                    >
                      <TagIcon className="size-3" />
                      {t.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">Nenhuma tag</span>
              )}
            </div>
            {conversation.automation && (
              <div>
                <span className="text-xs text-muted-foreground block mb-1">
                  Automação originária
                </span>
                <Badge
                  variant="outline"
                  className="text-xs font-normal"
                >
                  {conversation.automation.name}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Estado de Capturas */}
        {emailCaptures.length > 0 && (
          <Card>
            <CardHeader className="py-4 px-6 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Mail className="size-4" />
                Capturas de E-mail
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {emailCaptures.map((ec) => (
                <div
                  key={ec.id}
                  className="rounded-md border p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Solicitação</span>
                    {ec.status === 'COMPLETED' && (
                      <Badge
                        variant="default"
                        className="bg-emerald-600 text-[10px] gap-1 py-0"
                      >
                        <CheckCircle2 className="size-2.5" /> Concluída
                      </Badge>
                    )}
                    {ec.status === 'PENDING' && (
                      <Badge
                        variant="outline"
                        className="text-amber-600 border-amber-300 text-[10px] gap-1 py-0"
                      >
                        <Clock className="size-2.5" /> Aguardando resposta
                      </Badge>
                    )}
                    {ec.status === 'PROCESSING' && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] gap-1 py-0"
                      >
                        Processando
                      </Badge>
                    )}
                    {ec.status === 'SUPERSEDED' && (
                      <Badge
                        variant="secondary"
                        className="text-muted-foreground text-[10px] py-0"
                      >
                        Substituída por mais recente
                      </Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground">
                    Enviada em {new Date(ec.createdAt).toLocaleString('pt-BR')}
                  </div>
                  {ec.completedAt && (
                    <div className="text-muted-foreground">
                      Concluída em {new Date(ec.completedAt).toLocaleString('pt-BR')}
                    </div>
                  )}
                  {ec.errorMessage && (
                    <div className="text-destructive font-medium mt-1">{ec.errorMessage}</div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
