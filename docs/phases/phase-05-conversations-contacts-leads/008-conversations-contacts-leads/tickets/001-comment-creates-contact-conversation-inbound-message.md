---
title: "Comentário cria contato, conversa e mensagem de entrada"
status: "closed"
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

- [x] O modelo e a migration persistem `Contact`, `Conversation` e `Message` com ownership de workspace, provider, modo, conexão, identidade externa normalizada e timestamps de interação.
- [x] Um comentário correspondente cria ou resolve um contato desde a primeira interação, mesmo sem e-mail ou lead.
- [x] A mesma identidade no mesmo workspace, provider, modo e conexão reutiliza o contato e a conversa e atualiza a última interação.
- [x] Provider, modo, conexão ou workspace distintos não são unidos implicitamente, e identificadores enviados pelo cliente não autorizam nem definem o tenant.
- [x] A mensagem de comentário é vinculada à execução e usa identidade determinística para que retry, redelivery e concorrência não criem duplicatas.
- [x] A execução correspondente passa a referenciar contato e conversa sem alterar seu input, snapshot ou saídas imutáveis.
- [x] Testes unitários, PostgreSQL e worker cobrem criação, reutilização, concorrência, redelivery e isolamento multi-tenant.
- [x] Typecheck, lint, formatter, migration e testes relevantes são executados e registrados em `Result`.

## Blocked by

None - can start immediately. A Fase 4 fornece execução, worker e input normalizado.

## Result

Implementação concluída com sucesso:

1. **Modelo e Migrations**:
   - Adicionados os modelos `Contact`, `Conversation` e `Message` ao `prisma/schema.prisma` com ownership obrigatório por `organizationId`, dimensões de `provider`, `mode` (`SIMULATED`), `channelConnectionId` nulo para simulação e timestamps de interação.
   - Adicionados os enums `ConversationStatus`, `MessageDirection`, `MessageType` e `MessageStatus`.
   - Gerada e aplicada a migration `0005_contacts_conversations_messages/migration.sql` com constraints e índices parciais no PostgreSQL (`Contact_organizationId_provider_mode_externalUserId_null_conn_key`, `Conversation_organizationId_contactId_provider_mode_null_conn_key`, `Message_executionId_type_direction_key`, `Message_conversationId_externalId_key`).
   - Adicionados `contactId` e `conversationId` a `AutomationExecution` com chaves estrangeiras (`ON DELETE SET NULL`) e índices.

2. **Contratos e Domínio**:
   - Adicionadas funções utilitárias em `@engancha/contracts`: `normalizeContactExternalUserId`, `normalizeContactUsername`, `deterministicCommentMessageExternalId`.
   - Adicionados schemas e types para `ConversationStatus`, `MessageDirection`, `MessageType`, `MessageStatus`.
   - Adicionados campos opcionais `contactId` e `conversationId` em `simulationExecutionResponseSchema`.
   - Atualizado `SimulationsService.present()` para expor `contactId` e `conversationId` na projeção autorizada.

3. **Worker e Resolução Transacional**:
   - Atualizados `AutomationExecutionRepository`, `AutomationExecutionConsumer` e `AutomationExecutionService` para selecionar e propagar `contactId` e `conversationId`.
   - Implementada resolução transacional em `PrismaAutomationExecutionRepository.saveExecutionCompleted`:
     - Resolução/criação atômica de `Contact` por identidade normalizada.
     - Resolução/criação atômica de `Conversation` para o contato no contexto do canal.
     - Persistência determinística da mensagem de comentário (`INBOUND`, `COMMENT`, `RECEIVED`) vinculada à execução e conversa.
     - Associação de `contactId` e `conversationId` à `AutomationExecution` sem alterar inputs, snapshots ou outputs imutáveis.
     - Convergência sob retry, redelivery e concorrência através de chaves únicas e blocos de recuperação.

4. **Verificação e Qualidade**:
   - Criada suíte completa em `tests/contacts-conversations-execution.test.mjs` cobrindo normalização, propagação no service, criação, reutilização, concorrência, redelivery e isolamento multi-tenant com PostgreSQL real.
   - Todos os testes unitários, de integração e e2e passaram (`npm test` e `node --test tests/contacts-conversations-execution.test.mjs`).
   - `npm run typecheck`, `npm run lint` e `npm run format:check` executados e aprovados com zero erros.
