---
title: "Lista de contatos mostra identidade, tags e estado de lead"
status: "closed"
type: "AFK"
parent: "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md"
blocked_by:
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/003-automation-configures-and-applies-optional-tag.md"
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/004-email-response-enriches-contact-and-creates-first-lead.md"
user_stories: [2, 5, 6]
---

## Parent

PRD `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md`; entrega a consulta de pessoas das User Stories 2, 5 e 6.

## What to build

Entregar `GET /api/v1/contacts` e a página `Contatos` para consultar identidade social, e-mail quando capturado, provider, modo, tags, estado de lead e última interação. A lista deve permitir busca textual e filtros de provider/modo, tag e estado de lead com paginação canônica por offset (`page`, `limit`, `total`, `totalPages`), ordenação estável e estado aplicável na URL.

## Acceptance criteria

- [x] O endpoint retorna contatos do workspace ativo em ordem estável de última interação e pagina com paginação canônica (`page`, `limit`, `total`, `totalPages`).
- [x] Busca encontra a identidade exibida e o e-mail normalizado quando autorizado, sem vazar dados por mensagens de erro ou logs.
- [x] Filtros de provider, modo, tag e estado de lead podem ser combinados e preservam estabilidade entre páginas.
- [x] Cada linha distingue contato sem e-mail, contato com e-mail e contato convertido, mostrando tags sem tratar lead como outra pessoa.
- [x] Índices suportam unicidade de identidade/e-mail e os caminhos de busca, filtro e ordenação definidos.
- [x] A página mantém filtros na URL (`page`, `limit`, `query`, `leadState`, `provider`) e diferencia vazio inicial, sem resultados, loading, erro recuperável e acesso negado.
- [x] Busca, filtros e IDs estrangeiros não revelam contatos, tags ou leads de outro workspace.
- [x] Testes de contrato, API E2E e browser cobrem estados, paginação, filtros combinados, PII, acessibilidade e isolamento multi-tenant.
- [x] Typecheck, lint, formatter e testes relevantes são executados e registrados em `Result`.

## Blocked by

- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/003-automation-configures-and-applies-optional-tag.md`
- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/004-email-response-enriches-contact-and-creates-first-lead.md`

## Result

Implementado e aprovado com sucesso:
- **Contratos (`@engancha/contracts`)**: `contactListQuerySchema` normalizado (`page`, `limit`, `query`, `provider`, `mode`, `tagId`, `leadState`), `contactSummarySchema` e `contactListResponseSchema`.
- **API (`apps/api`)**: `GET /api/v1/contacts` exposto em `ContactsController` e `ConversationsService.listContacts`, com isolamento rígido multi-tenant, ordenação estável por `lastInteractionAt desc`, busca textual em nome/username/email, filtros combinados de provider e estado de lead, e metadados de paginação canônica.
- **Frontend (`apps/web`)**: Rota `/_authenticated/contacts`, `ContactsListView`, `ContactsTable`, colunas modulares `contacts-columns.tsx`, integração com `DataTablePagination`, filtros na URL e empty states contextuais.
- **Testes**: `tests/conversations-contacts-domain.test.mjs`, `apps/api/src/modules/conversations/conversations.e2e-spec.ts` e testes browser `apps/web/src/features/contacts/views/contacts-list-view.test.tsx`.
- **Validação**: `npm run verify` passou com 100% de sucesso em typecheck, testes e lint.
