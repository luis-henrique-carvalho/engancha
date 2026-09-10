---
title: "Falha e reprocessamento preservam idempotência"
status: "done"
type: "AFK"
parent: "docs/phases/phase-04-end-to-end-simulation/005-end-to-end-simulation/prd.md"
blocked_by:
  - "docs/phases/phase-04-end-to-end-simulation/005-end-to-end-simulation/tickets/003-simulated-journey-with-reply-dm-and-link.md"
  - "docs/phases/phase-04-end-to-end-simulation/005-end-to-end-simulation/tickets/004-email-capture-ends-with-simulated-request.md"
user_stories: [7, 8]
---

## Parent

PRD `docs/phases/phase-04-end-to-end-simulation/005-end-to-end-simulation/prd.md`; cobre `FR-SIM-008`, aplica `RN-004`, `RN-005` e atende às User Stories 7 e 8.

## What to build

Tornar falhas e recuperação observáveis e seguras. Configurar tentativas/backoff para falhas transitórias, persistir `FAILED` somente após esgotamento, expor reprocessamento manual exclusivo de falhas e reutilizar a mesma execução, input, snapshot e identidades de saída durante um novo ciclo.

## Acceptance criteria

- [x] Falhas transitórias lançadas pelo processor usam tentativas e backoff exponencial explícitos sem derrubar o worker.
- [x] Tentativas e erro sanitizado ficam persistidos; somente o esgotamento produz estado terminal `FAILED`.
- [x] `POST /api/v1/simulations/executions/:id/retry` aceita apenas execução `FAILED` do workspace ativo.
- [x] Retry de `PENDING`, `PROCESSING`, `COMPLETED` ou `IGNORED` retorna erro de transição estável e não enfileira trabalho.
- [x] O reprocessamento mantém `executionId`, input e snapshot já selecionado, inicia novo ciclo controlado e não cria segunda execução lógica.
- [x] Saídas previamente comprometidas são reconhecidas/upsertadas pelas mesmas chaves e nunca duplicadas após falha parcial, retry ou redelivery.
- [x] Repetir o POST original de uma execução falha retorna a execução existente e não funciona como retry implícito.
- [x] Testes de worker, fila, Prisma e API cobrem falha transitória, falha definitiva, falha parcial, elegibilidade, concorrência de retries, idempotência e continuidade de jobs independentes.

## Blocked by

- `docs/phases/phase-04-end-to-end-simulation/005-end-to-end-simulation/tickets/003-simulated-journey-with-reply-dm-and-link.md`
- `docs/phases/phase-04-end-to-end-simulation/005-end-to-end-simulation/tickets/004-email-capture-ends-with-simulated-request.md`

## Result

- Implementada política de resiliência e tratamento de falhas transitórias no worker (`BullMqAutomationExecutionProcessor` e `AutomationExecutionService`), delegando o ciclo de retries com backoff exponencial do BullMQ (`attempts: 4, backoff: 2s`) sem derrubar o worker host.
- Tratamento de tentativas: persistência não-terminal (`status: PENDING`, incremento de `stateVersion`) enquanto `attemptsMade < attempts`, transicionando para estado terminal `FAILED` com mensagem de erro sanitizada e código de erro estável apenas após esgotamento total de tentativas.
- Exposto endpoint `POST /api/v1/simulations/executions/:id/retry` protegido por autenticação e workspace ativo, aceitando reprocessamento exclusivo de execuções `FAILED`.
- Validação de transição de estado estável: tentativas de retry em estados não-`FAILED` (`PENDING`, `PROCESSING`, `COMPLETED`, `IGNORED`) retornam `409 Conflict` (`INVALID_EXECUTION_STATE_FOR_RETRY`) de forma atômica e idempotente.
- Preservação de identidade e snapshot: reprocessamento mantém o mesmo `executionId`, input original e snapshot de automação previamente selecionado, reutilizando chaves determinísticas de saída via `upsert` para evitar duplicações.
- Reenvio idempotente: repetição do `POST /api/v1/simulations/comments` original para execução `FAILED` retorna a execução existente sem disparar retry implícito.
- Validações e testes:
  - `tests/worker-automation-execution.test.mjs`: eventos e tratamento de falhas transitórias, falha definitiva sanitizada, reuso de snapshot e upsert de saídas.
  - `tests/simulations-ingestion.test.mjs`: retry elegível vs rejeições 409, repetição de POST sem retry implícito.
  - `apps/api/src/modules/simulations/simulations.e2e-spec.ts`: fluxo completo e2e de falha, retry, concorrência de retries (201 vs 409), isolamento de tenant (404) e continuidade de processamento.
