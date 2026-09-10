---
title: "Automação configura e aplica tag opcional"
status: "needs-triage"
type: "AFK"
parent: "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md"
blocked_by:
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/001-comment-creates-contact-conversation-inbound-message.md"
user_stories: [5]
---

## Parent

PRD `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md`; entrega a segmentação simples da User Story 5 e da decisão DEC-02.

## What to build

Permitir que uma automação configure zero ou uma tag do workspace, selecionando uma existente ou criando-a inline por nome. A revisão publicada deve capturar a ação `APPLY_TAG`, exibi-la na revisão da automação e aplicá-la idempotentemente ao contato quando uma execução correspondente alcançar a ação.

A fatia cobre persistência de `Tag` e `ContactTag`, contratos, edição/revisão no frontend e execução no worker. A gestão independente, remoção e múltiplas tags permanecem fora do escopo.

## Acceptance criteria

- [ ] `Tag` possui nome normalizado único por workspace, e `ContactTag` impede associação duplicada entre contato e tag.
- [ ] O editor permite deixar a tag vazia, selecionar uma tag do workspace ou criar uma única tag inline com validação acessível.
- [ ] Identificadores de tag de outro workspace são rejeitados sem revelar a existência do recurso.
- [ ] A revisão da automação e o snapshot publicado preservam zero ou uma ação `APPLY_TAG` na ordem definida.
- [ ] Uma execução correspondente aplica a tag ao contato uma vez, inclusive antes de existir e-mail ou lead, e registra a origem para rastreabilidade.
- [ ] Retry, redelivery, repetição da execução ou conversão posterior do contato não duplicam a associação.
- [ ] Testes de contrato, domínio, API, worker e web cobrem normalização, criação/seleção, publicação, aplicação, duplicidade e isolamento multi-tenant.
- [ ] Typecheck, lint, formatter, migration e testes relevantes são executados e registrados em `Result`.

## Blocked by

- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/001-comment-creates-contact-conversation-inbound-message.md`

## Result

Não iniciado.
