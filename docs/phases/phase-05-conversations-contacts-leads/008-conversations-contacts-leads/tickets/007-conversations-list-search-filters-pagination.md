---
title: "Lista de conversas oferece busca, filtros e paginação"
status: "closed"
type: "AFK"
parent: "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md"
blocked_by:
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/002-execution-outputs-build-idempotent-ordered-history.md"
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/003-automation-configures-and-applies-optional-tag.md"
user_stories: [1, 5, 6]
---

## Parent

PRD `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md`; entrega a superfície de descoberta de conversas das User Stories 1, 5 e 6.

## What to build

Entregar `GET /api/v1/conversations` e a página `Conversas` com resumos do contato, última mensagem, provider, marcador de simulação, automação, estado de lead, tags e última atividade. A consulta deve seguir o padrão canônico de paginação por offset (`page`, `limit`, `total`, `totalPages`), permitir busca e os filtros de período, status da execução, automação, presença de lead e tag, e manter o estado aplicável na URL.

## Acceptance criteria

- [x] O endpoint retorna somente conversas do workspace ativo em ordem estável de atividade com paginação canônica (`page`, `limit`, `total`, `totalPages`).
- [x] Busca e filtros de período, status, automação, lead e tag podem ser combinados sem duplicar ou omitir registros entre páginas.
- [x] Resumos incluem identidade do contato, preview seguro, provider, modo simulado, automação, lead, tags e última atividade sem expor modelos internos.
- [x] Índices e plano de consulta atendem os caminhos de ordenação e filtros previstos para o MVP.
- [x] A página segue os padrões existentes de lista (`DataTablePagination`), mantém filtros na URL e navega para o detalhe autorizado.
- [x] Estados inicial vazio, sem resultados, carregando, erro recuperável e acesso negado são distintos e acessíveis.
- [x] Identificadores, filtros e parâmetros não permitem inferir conversas, contatos, tags ou automações de outro workspace.
- [x] Testes de contrato, API E2E e browser cobrem paginação estável, combinações de filtros, recuperação, responsividade e isolamento multi-tenant.
- [x] Typecheck, lint, formatter e testes relevantes são executados e registrados em `Result`.

## Blocked by

- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/002-execution-outputs-build-idempotent-ordered-history.md`
- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/003-automation-configures-and-applies-optional-tag.md`

## Result

Implementado e aprovado com sucesso:
- **Contratos (`@engancha/contracts`)**: `conversationListQuerySchema` normalizado com `page`, `limit`, `query`, `hasLead`, `status`, etc., e `conversationListResponseSchema` com `items` e `meta: paginationMetaSchema`.
- **API (`apps/api`)**: Endpoint `GET /api/v1/conversations` implementado em `ConversationsController` e `ConversationsService.listConversations`, com isolamento rígido multi-tenant, ordenação estável por `lastMessageAt desc`, busca textual em contatos/mensagens e paginação offset canônica.
- **Frontend (`apps/web`)**: Rota `/_authenticated/conversations`, `ConversationsListView`, `ConversationsTable`, colunas modulares `conversations-columns.tsx`, integração com `DataTablePagination`, filtros na URL e navegação para o detalhe.
- **Testes**: `tests/conversations-contacts-domain.test.mjs`, `apps/api/src/modules/conversations/conversations.e2e-spec.ts` e testes browser `apps/web/src/features/conversations/views/conversations-list-view.test.tsx`.
- **Validação**: `npm run verify` passou com 100% de sucesso em typecheck, testes e lint.
