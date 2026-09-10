---
title: "Detalhe da conversa mostra histórico e estado da captura"
status: "closed"
type: "AFK"
parent: "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md"
blocked_by:
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/002-execution-outputs-build-idempotent-ordered-history.md"
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/004-email-response-enriches-contact-and-creates-first-lead.md"
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/005-email-capture-handles-conflict-supersession-concurrency-and-retry.md"
user_stories: [1, 3, 6]
---

## Parent

PRD `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md`; entrega o detalhe cronológico das User Stories 1, 3 e 6.

## What to build

Entregar `GET /api/v1/conversations/:id` e o detalhe de conversa com cabeçalho do contato, contexto de provider/simulação, tags, estado de lead e histórico cronológico. Cada item deve comunicar direção e tipo em linguagem de produto, permitir rastrear a automação/execução originária e representar capturas pendentes, processando, concluídas ou substituídas sem vocabulário de infraestrutura.

## Acceptance criteria

- [x] O endpoint retorna `404` para conversa inexistente ou estrangeira e nunca confia em tenant fornecido pelo cliente.
- [x] Mensagens são ordenadas por chave estável e exibem comentário, resposta pública, DMs, link, solicitação e resposta aceita exatamente uma vez.
- [x] O detalhe apresenta contato, provider, modo simulado, tags, lead e origem da automação/execução quando aplicável.
- [x] Capturas pendentes, processando, concluídas, substituídas e com ação recuperável têm representação compreensível sem termos de fila, worker ou stack trace.
- [x] Conteúdo, e-mail e link aparecem somente na projeção autorizada e não vazam por erros, telemetria ou metadados de navegação.
- [x] Loading, vazio improvável, erro recuperável, não encontrado e atualização da projeção preservam foco e leitura cronológica.
- [x] A implementação web respeita a estrutura `views/`, `components/`, `hooks/` e `services/` e os padrões visuais existentes.
- [x] Testes de API e browser cobrem ordem, tipos, estados de captura, reload/recuperação, acessibilidade e isolamento multi-tenant.
- [x] Typecheck, lint, formatter e testes relevantes são executados e registrados em `Result`.

## Blocked by

- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/002-execution-outputs-build-idempotent-ordered-history.md`
- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/004-email-response-enriches-contact-and-creates-first-lead.md`
- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/005-email-capture-handles-conflict-supersession-concurrency-and-retry.md`

## Result

Implementado e aprovado com sucesso:
- **Contratos (`@engancha/contracts`)**: `conversationDetailResponseSchema`, `conversationMessageSchema` e `emailCaptureDetailSchema`.
- **API (`apps/api`)**: `GET /api/v1/conversations/:id` implementado em `ConversationsController` e `ConversationsService.getConversationById` retornando mensagens ordenadas cronologicamente por `position asc, createdAt asc`, projeção segura do contato, lead associado, tags, automação originária e capturas de e-mail. Retorna `404 NotFoundException` para conversas inexistentes ou de outro workspace.
- **Frontend (`apps/web`)**: Rota `/_authenticated/conversations/$conversationId`, view `ConversationDetailView`, componentes `ConversationChat`, `ConversationContactCard` e `ConversationEmailCapturesCard` com layout em colunas, histórico em bolhas com badges amigáveis sem jargões de infraestrutura, e cards laterais de identidade e status de captura.
- **Testes e Validação**: Cobertos por `conversations.e2e-spec.ts` (retorno do histórico completo, 404 para foreign workspace) e suite completa `npm run verify` com 100% de aprovação.
