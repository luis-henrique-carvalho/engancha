---
title: "Lista de leads mostra origem, captura, tags e filtros"
status: "needs-triage"
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

- [ ] O endpoint retorna somente leads do workspace ativo, ordenados de forma estável pela primeira captura e paginados por cursor opaco.
- [ ] Cada item referencia o mesmo contato, seu e-mail autorizado, `capturedAt`, automação/execução de primeira atribuição e tags atuais.
- [ ] Capturas posteriores não alteram a origem exibida nem criam linhas adicionais para o mesmo contato.
- [ ] Busca e filtros de provider, modo, automação e tag podem ser combinados sem instabilidade ou duplicidade entre páginas.
- [ ] Índices atendem unicidade do lead por contato e os caminhos de ordenação e filtro previstos.
- [ ] A página mantém filtros na URL e diferencia vazio inicial, sem resultados, loading, erro recuperável e acesso negado.
- [ ] Cursor, filtros, busca e IDs de automação ou tag estrangeiros não revelam leads ou contatos de outro workspace.
- [ ] Testes de contrato, API E2E e browser cobrem primeira atribuição, filtros, paginação, PII, acessibilidade e isolamento multi-tenant.
- [ ] Typecheck, lint, formatter e testes relevantes são executados e registrados em `Result`.

## Blocked by

- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/003-automation-configures-and-applies-optional-tag.md`
- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/004-email-response-enriches-contact-and-creates-first-lead.md`

## Result

Não iniciado.
