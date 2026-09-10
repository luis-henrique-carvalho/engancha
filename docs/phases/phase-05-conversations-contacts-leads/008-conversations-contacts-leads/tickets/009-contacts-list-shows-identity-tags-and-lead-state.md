---
title: "Lista de contatos mostra identidade, tags e estado de lead"
status: "needs-triage"
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

Entregar `GET /api/v1/contacts` e a página `Contatos` para consultar identidade social, e-mail quando capturado, provider, modo, tags, estado de lead e última interação. A lista deve permitir busca textual e filtros de provider/modo, tag e estado de lead com cursor, ordenação estável e estado aplicável na URL.

## Acceptance criteria

- [ ] O endpoint retorna contatos do workspace ativo em ordem estável de última interação e pagina por cursor opaco.
- [ ] Busca encontra a identidade exibida e o e-mail normalizado quando autorizado, sem vazar dados por mensagens de erro ou logs.
- [ ] Filtros de provider, modo, tag e estado de lead podem ser combinados e preservam estabilidade entre páginas.
- [ ] Cada linha distingue contato sem e-mail, contato com e-mail e contato convertido, mostrando tags sem tratar lead como outra pessoa.
- [ ] Índices suportam unicidade de identidade/e-mail e os caminhos de busca, filtro e ordenação definidos.
- [ ] A página mantém filtros na URL e diferencia vazio inicial, sem resultados, loading, erro recuperável e acesso negado.
- [ ] Cursor, busca, filtros e IDs estrangeiros não revelam contatos, tags ou leads de outro workspace.
- [ ] Testes de contrato, API E2E e browser cobrem estados, paginação, filtros combinados, PII, acessibilidade e isolamento multi-tenant.
- [ ] Typecheck, lint, formatter e testes relevantes são executados e registrados em `Result`.

## Blocked by

- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/003-automation-configures-and-applies-optional-tag.md`
- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/004-email-response-enriches-contact-and-creates-first-lead.md`

## Result

Não iniciado.
