---
title: "Worker processa job de verificação"
status: "done"
type: "AFK"
parent: "docs/prds/local-executable-monorepo-foundation.md"
blocked_by:
  - "docs/tickets/local-executable-monorepo-foundation/003-infraestrutura-local-e-health-checks.md"
  - "docs/tickets/local-executable-monorepo-foundation/004-contrato-do-job-e-registro-de-filas.md"
  - "docs/tickets/local-executable-monorepo-foundation/005-api-enfileira-job-de-verificacao.md"
user_stories: [3]
---

## Parent

PRD `local-executable-monorepo-foundation`; cobre a User Story 3 e os critérios de aceite do consumo pelo worker, revalidação, logs correlacionáveis, retry e isolamento de falhas.

## What to build

Configurar o worker NestJS para consumir a fila técnica, revalidar o payload pelo contrato compartilhado, registrar o processamento com correlação, aplicar retry/backoff e deixar falhas definitivas observáveis sem derrubar o processo nem impedir outros jobs.

## Acceptance criteria

- [x] O worker consome jobs da fila de verificação usando o contrato compartilhado.
- [x] Payloads inválidos são rejeitados no consumo e não são processados como válidos.
- [x] Logs de recebimento, processamento, sucesso, retry e falha definitiva incluem a correlação do job.
- [x] Uma falha de processamento não encerra o worker nem bloqueia jobs independentes.
- [x] Encerramento do worker interrompe novos consumos e aguarda atividades seguras em curso.
- [x] Testes cobrem consumo válido, payload inválido, retry e falha definitiva.

## Blocked by

- `docs/tickets/local-executable-monorepo-foundation/003-infraestrutura-local-e-health-checks.md`
- `docs/tickets/local-executable-monorepo-foundation/004-contrato-do-job-e-registro-de-filas.md`
- `docs/tickets/local-executable-monorepo-foundation/005-api-enfileira-job-de-verificacao.md`

## Result

Implementado em 2026-08-13 na branch `feat/implementar-api-de-enfileiramento`.

### Comportamento entregue

- O worker cria um consumidor BullMQ para a fila técnica `verification`, com concorrência unitária e readiness aguardado antes do evento `ready`.
- O consumidor segue o padrão oficial do NestJS com `BullModule`, `@Processor()` e `WorkerHost`; o ciclo de vida do worker é gerenciado pelos hooks do `@nestjs/bullmq`.
- Cada job é revalidado por `verificationJobSchema`; payload inválido gera `UnrecoverableError` e não chama o executor.
- O processor emite `job_received`, `job_processing` e `job_succeeded`; falhas transitórias emitem `job_retry` e falhas sem tentativas restantes emitem `job_failed_definitive`.
- O encerramento fecha o `Worker` com `worker.close()`, interrompendo novos consumos e aguardando o processamento ativo.

### Arquivos principais

- `apps/worker/src/verification/verification.worker.ts`
- `apps/worker/src/verification/verification.job.ts`
- `apps/worker/src/app.module.ts`
- `apps/worker/src/main.ts`
- `apps/worker/tsconfig.json`
- `apps/worker/package.json`
- `tests/worker-verification.test.mjs`

### Decisões

- A falha de payload é marcada como não recuperável para evitar retries de uma mensagem que nunca será válida.
- O executor inicial é um no-op técnico que confirma o transporte e devolve a correlação; a semântica de negócio permanece fora desta fundação.
- O processamento é delegado ao BullMQ, que captura exceções do processor e mantém o worker vivo para jobs independentes.
- A configuração e as regras de manutenção estão documentadas em `docs/NESTJS-BULLMQ-BEST-PRACTICES.md`.

### Validações executadas

- `npm run typecheck` — todos os workspaces passaram.
- `npm test` — 6 arquivos de teste passaram, incluindo consumo válido, payload inválido, retry, falha definitiva e shutdown.
- `npm run lint` — passou.
- `npm run format:check` — passou.
- `npm run build --workspace=@engancha/worker` — passou.
- `git diff --check` — passou.
- `graphify update .` — grafo atualizado no worktree.
