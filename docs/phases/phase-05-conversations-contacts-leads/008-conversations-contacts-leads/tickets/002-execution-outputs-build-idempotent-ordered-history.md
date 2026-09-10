---
title: "Saídas da execução formam histórico ordenado e idempotente"
status: "needs-triage"
type: "AFK"
parent: "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md"
blocked_by:
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/001-comment-creates-contact-conversation-inbound-message.md"
user_stories: [1, 7]
---

## Parent

PRD `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md`; completa a projeção de histórico das User Stories 1 e 7.

## What to build

Projetar as saídas visíveis de uma execução correspondente como mensagens ordenadas da conversa criada no ticket 001. O histórico deve representar resposta pública, DM, entrega de link e solicitação de e-mail com direção, tipo, ordem e origem explícitos, preservando as saídas da execução como evidência imutável.

Quando existir solicitação de e-mail, persistir também a `EmailCaptureRequest` pendente atribuída à mensagem, contato, conversa, automação, revisão e execução. Uma projeção repetida deve resolver as mesmas mensagens e a mesma solicitação, sem reabrir a execução concluída.

## Acceptance criteria

- [ ] Resposta pública, DM e link ou solicitação de e-mail são projetados uma vez e na ordem produzida pela execução.
- [ ] Cada mensagem preserva direção, tipo, provider, modo, posição e origem na execução ou saída correspondente.
- [ ] As saídas originais da execução permanecem imutáveis e consultáveis depois da projeção.
- [ ] A solicitação de e-mail cria uma `EmailCaptureRequest` pendente vinculada a contato, conversa, mensagem, automação, revisão e execução concluída.
- [ ] Redelivery, retry e reprocessamento manual resolvem as mesmas identidades determinísticas de mensagem e captura.
- [ ] Uma execução ignorada ou falha não inventa mensagens enviadas que não constem de suas saídas persistidas.
- [ ] Testes cobrem jornadas com link e e-mail, ordenação, projeção parcial recuperável, redelivery e isolamento entre workspaces.
- [ ] Typecheck, lint, formatter, migration e testes relevantes são executados e registrados em `Result`.

## Blocked by

- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/001-comment-creates-contact-conversation-inbound-message.md`

## Result

Não iniciado.
