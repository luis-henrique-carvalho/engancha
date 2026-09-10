---
title: "Lista de conversas oferece busca, filtros e paginação"
status: "needs-triage"
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

Entregar `GET /api/v1/conversations` e a página `Conversas` com resumos do contato, última mensagem, provider, marcador de simulação, automação, estado de lead, tags e última atividade. A consulta deve usar cursor e ordenação estável, permitir busca e os filtros de período, status da execução, automação, presença de lead e tag, e manter o estado aplicável na URL.

## Acceptance criteria

- [ ] O endpoint retorna somente conversas do workspace ativo em ordem estável de atividade e com cursor opaco validado estritamente.
- [ ] Busca e filtros de período, status, automação, lead e tag podem ser combinados sem duplicar ou omitir registros entre páginas.
- [ ] Resumos incluem identidade do contato, preview seguro, provider, modo simulado, automação, lead, tags e última atividade sem expor modelos internos.
- [ ] Índices e plano de consulta atendem os caminhos de ordenação e filtros previstos para o MVP.
- [ ] A página segue os padrões existentes de lista, mantém filtros na URL e navega para o detalhe autorizado.
- [ ] Estados inicial vazio, sem resultados, carregando, erro recuperável e acesso negado são distintos e acessíveis.
- [ ] Identificadores, filtros e cursores não permitem inferir conversas, contatos, tags ou automações de outro workspace.
- [ ] Testes de contrato, API E2E e browser cobrem paginação estável, combinações de filtros, recuperação, responsividade e isolamento multi-tenant.
- [ ] Typecheck, lint, formatter e testes relevantes são executados e registrados em `Result`.

## Blocked by

- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/002-execution-outputs-build-idempotent-ordered-history.md`
- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/003-automation-configures-and-applies-optional-tag.md`

## Result

Não iniciado.
