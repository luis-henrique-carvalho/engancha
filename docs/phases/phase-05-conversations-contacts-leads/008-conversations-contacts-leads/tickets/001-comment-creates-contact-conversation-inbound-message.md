---
title: "Comentário cria contato, conversa e mensagem de entrada"
status: "needs-triage"
type: "AFK"
parent: "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md"
blocked_by: []
user_stories: [1, 2, 7]
---

## Parent

PRD `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md`; entrega a primeira fatia persistente das User Stories 1, 2 e 7.

## What to build

Transformar todo comentário simulado correspondente em histórico de produto: criar ou resolver o contato pela identidade normalizada do autor, criar ou reutilizar a conversa pelo contexto de workspace, provider, modo e conexão, persistir uma única mensagem de entrada e vincular contato e conversa à execução existente. A operação deve convergir sob retry ou concorrência e manter `mode=SIMULATED` e conexão nula como contexto decidido pelo servidor.

Esta fatia inclui modelo, migration, contratos internos, projeção autorizada mínima e testes necessários para provar o fluxo desde o worker de simulação até PostgreSQL, sem ainda projetar as saídas geradas pela automação.

## Acceptance criteria

- [ ] O modelo e a migration persistem `Contact`, `Conversation` e `Message` com ownership de workspace, provider, modo, conexão, identidade externa normalizada e timestamps de interação.
- [ ] Um comentário correspondente cria ou resolve um contato desde a primeira interação, mesmo sem e-mail ou lead.
- [ ] A mesma identidade no mesmo workspace, provider, modo e conexão reutiliza o contato e a conversa e atualiza a última interação.
- [ ] Provider, modo, conexão ou workspace distintos não são unidos implicitamente, e identificadores enviados pelo cliente não autorizam nem definem o tenant.
- [ ] A mensagem de comentário é vinculada à execução e usa identidade determinística para que retry, redelivery e concorrência não criem duplicatas.
- [ ] A execução correspondente passa a referenciar contato e conversa sem alterar seu input, snapshot ou saídas imutáveis.
- [ ] Testes unitários, PostgreSQL e worker cobrem criação, reutilização, concorrência, redelivery e isolamento multi-tenant.
- [ ] Typecheck, lint, formatter, migration e testes relevantes são executados e registrados em `Result`.

## Blocked by

None - can start immediately. A Fase 4 fornece execução, worker e input normalizado.

## Result

Não iniciado.
