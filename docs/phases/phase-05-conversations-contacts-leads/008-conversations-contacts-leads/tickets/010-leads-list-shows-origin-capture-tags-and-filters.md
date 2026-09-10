---
title: "Lista de leads mostra origem, captura, tags e filtros"
status: "closed"
type: "AFK"
parent: "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md"
blocked_by:
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/003-automation-configures-and-applies-optional-tag.md"
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/004-email-response-enriches-contact-and-creates-first-lead.md"
user_stories: [4, 5, 6]
---

## Parent

PRD `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md`; entrega a consulta de conversões das User Stories 4, 5 e 6.

## What to build

Entregar `GET /api/v1/leads` e a página `Leads` para consultar a identidade e e-mail do contato, primeira data de captura, automação de origem e tags. A superfície deve deixar claro que lead é um estado único do contato, permitir busca e filtros de provider/modo, automação e tag e usar paginação por cursor com ordenação estável pela primeira captura.

## Acceptance criteria

- [x] O endpoint retorna somente leads do workspace ativo, ordenados de forma estável pela primeira captura e paginados por cursor opaco.
- [x] Cada item referencia o mesmo contato, seu e-mail autorizado, `capturedAt`, automação/execução de primeira atribuição e tags atuais.
- [x] Capturas posteriores não alteram a origem exibida nem criam linhas adicionais para o mesmo contato.
- [x] Busca e filtros de provider, modo, automação e tag podem ser combinados sem instabilidade ou duplicidade entre páginas.
- [x] Índices atendem unicidade do lead por contato e os caminhos de ordenação e filtro previstos.
- [x] A página mantém filtros na URL e diferencia vazio inicial, sem resultados, loading, erro recuperável e acesso negado.
- [x] Cursor, filtros, busca e IDs de automação ou tag estrangeiros não revelam leads ou contatos de outro workspace.
- [x] Testes de contrato, API E2E e browser cobrem primeira atribuição, filtros, paginação, PII, acessibilidade e isolamento multi-tenant.
- [x] Typecheck, lint, formatter e testes relevantes são executados e registrados em `Result`.

## Blocked by

- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/003-automation-configures-and-applies-optional-tag.md`
- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/004-email-response-enriches-contact-and-creates-first-lead.md`

## Result

Implementado, revisado e aprovado com sucesso:
- **Contratos (`@engancha/contracts`)**: `cursorPaginationMetaSchema`, `leadSummarySchema`, `leadListQuerySchema` e `leadListResponseSchema` definidos com validação estrita via Zod.
- **API (`apps/api`)**: `GET /api/v1/leads` exposto em `LeadsController` e `ConversationsService.listLeads`, com ordenação estável `capturedAt desc, id desc`, paginação por cursor opaco em base64url, isolamento multi-tenant estrito (`organizationId`), busca textual em username/name/emailNormalized, e filtros combinados por provider, modo, automação e tag.
- **Frontend (`apps/web`)**: Rota `/_authenticated/leads`, `LeadsListView`, `LeadsTable`, colunas modulares `leads-columns.tsx`, `LeadsTableToolbar` e `LeadsPaginationBar`, integração com rota TanStack Router com sincronização na URL, item no menu de navegação da sidebar (`/leads`) e empty states/loading skeletons.
- **Testes & Validação**:
  - `tests/conversations-contacts-domain.test.mjs`: testes de esquema e cursor.
  - `apps/api/src/modules/conversations/conversations.e2e-spec.ts`: cobertura E2E completa de cursor pagination, filtros e isolamento multi-tenant.
  - `apps/web/src/features/leads/views/leads-list-view.test.tsx`: testes de componente browser cobrindo renderização vazia, dados e navegação por cursor.
  - `tests/web-routes.test.mjs`: validação de rotas e sidebar.
  - `code-review`: executado com aprovação em ambos os eixos (Standards e Spec).
  - `npm run verify`: 100% de sucesso em typecheck, lint, formatação Prettier e todos os 42 arquivos de teste (237 testes passando).

