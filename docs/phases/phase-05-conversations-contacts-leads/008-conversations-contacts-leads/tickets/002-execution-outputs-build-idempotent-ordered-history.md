---
title: "Saídas da execução formam histórico ordenado e idempotente"
status: "completed"
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

- [x] Resposta pública, DM e link ou solicitação de e-mail são projetados uma vez e na ordem produzida pela execução.
- [x] Cada mensagem preserva direção, tipo, provider, modo, posição e origem na execução ou saída correspondente.
- [x] As saídas originais da execução permanecem imutáveis e consultáveis depois da projeção.
- [x] A solicitação de e-mail cria uma `EmailCaptureRequest` pendente vinculada a contato, conversa, mensagem, automação, revisão e execução concluída.
- [x] Redelivery, retry e reprocessamento manual resolvem as mesmas identidades determinísticas de mensagem e captura.
- [x] Uma execução ignorada ou falha não inventa mensagens enviadas que não constem de suas saídas persistidas.
- [x] Testes cobrem jornadas com link e e-mail, ordenação, projeção parcial recuperável, redelivery e isolamento entre workspaces.
- [x] Typecheck, lint, formatter, migration e testes relevantes são executados e registrados em `Result`.

## Blocked by

- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/001-comment-creates-contact-conversation-inbound-message.md`

## Result

- **Schema e Migrações**:
  - `prisma/schema.prisma` e `0006_execution_history_captures_tags` estenderam `MessageType` (`DIRECT_MESSAGE_WITH_LINK`, `EMAIL_CAPTURE_REQUEST`), adicionaram coluna `position` em `Message` e criaram a tabela `EmailCaptureRequest` com status enum (`PENDING`, `PROCESSING`, `COMPLETED`, `SUPERSEDED`) e índices únicos determinísticos.
- **Contratos (`packages/contracts`)**:
  - `messageTypeSchema` atualizado; adicionados `emailCaptureRequestStatusSchema`, gerador de ID externo determinístico `deterministicOutputMessageExternalId` e `deterministicEmailCaptureRequestId`.
- **Worker (`apps/worker`)**:
  - `PrismaAutomationExecutionRepository.saveExecutionCompleted` projeta saídas visíveis em mensagens de saída ordenadas (`position >= 1`, timestamps estritamente crescentes), vinculando `executionId`, `direction: OUTBOUND`, e `payload` original.
  - Para `EMAIL_CAPTURE_REQUEST`, supersede pedidos `PENDING` anteriores na conversa e cria nova `EmailCaptureRequest` em estado `PENDING`.
  - Idempotência sob retry e redelivery validada: mensagens e solicitações determinísticas não se duplicam.
- **Testes & Verificação**:
  - `tests/contacts-conversations-execution.test.mjs` cobre projeção de histórico cronológico com link e captura de e-mail, monotonicidade de timestamps, transição de status para `SUPERSEDED`, retry idempotente e isolamento multi-tenant.
  - `npm run verify` executado com 100% de aprovação (typecheck, 93 testes monorepo, 2 e2e openapi, 11 e2e automações, 25 e2e simulações, 225 testes web vitest, lint e formatação).
