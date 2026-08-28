---
title: "Falha e reprocessamento preservam idempotência"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/end-to-end-simulation.md"
blocked_by:
  - "docs/tickets/end-to-end-simulation/003-jornada-simulada-com-resposta-dm-e-link.md"
  - "docs/tickets/end-to-end-simulation/004-captura-email-termina-em-solicitacao-simulada.md"
user_stories: [7, 8]
---

## Parent

PRD `docs/prds/end-to-end-simulation.md`; cobre `FR-SIM-008`, aplica `RN-004`, `RN-005` e atende às User Stories 7 e 8.

## What to build

Tornar falhas e recuperação observáveis e seguras. Configurar tentativas/backoff para falhas transitórias, persistir `FAILED` somente após esgotamento, expor reprocessamento manual exclusivo de falhas e reutilizar a mesma execução, input, snapshot e identidades de saída durante um novo ciclo.

## Acceptance criteria

- [ ] Falhas transitórias lançadas pelo processor usam tentativas e backoff exponencial explícitos sem derrubar o worker.
- [ ] Tentativas e erro sanitizado ficam persistidos; somente o esgotamento produz estado terminal `FAILED`.
- [ ] `POST /api/v1/simulations/executions/:id/retry` aceita apenas execução `FAILED` do workspace ativo.
- [ ] Retry de `PENDING`, `PROCESSING`, `COMPLETED` ou `IGNORED` retorna erro de transição estável e não enfileira trabalho.
- [ ] O reprocessamento mantém `executionId`, input e snapshot já selecionado, inicia novo ciclo controlado e não cria segunda execução lógica.
- [ ] Saídas previamente comprometidas são reconhecidas/upsertadas pelas mesmas chaves e nunca duplicadas após falha parcial, retry ou redelivery.
- [ ] Repetir o POST original de uma execução falha retorna a execução existente e não funciona como retry implícito.
- [ ] Testes de worker, fila, Prisma e API cobrem falha transitória, falha definitiva, falha parcial, elegibilidade, concorrência de retries, idempotência e continuidade de jobs independentes.

## Blocked by

- `docs/tickets/end-to-end-simulation/003-jornada-simulada-com-resposta-dm-e-link.md`
- `docs/tickets/end-to-end-simulation/004-captura-email-termina-em-solicitacao-simulada.md`

## Result

Preencher durante a implementação com comportamento entregue, política de retry/backoff, contratos, arquivos principais, decisões e validações executadas.
