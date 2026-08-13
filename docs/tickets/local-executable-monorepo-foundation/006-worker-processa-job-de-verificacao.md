---
title: "Worker processa job de verificação"
status: "needs-triage"
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

- [ ] O worker consome jobs da fila de verificação usando o contrato compartilhado.
- [ ] Payloads inválidos são rejeitados no consumo e não são processados como válidos.
- [ ] Logs de recebimento, processamento, sucesso, retry e falha definitiva incluem a correlação do job.
- [ ] Uma falha de processamento não encerra o worker nem bloqueia jobs independentes.
- [ ] Encerramento do worker interrompe novos consumos e aguarda atividades seguras em curso.
- [ ] Testes cobrem consumo válido, payload inválido, retry e falha definitiva.

## Blocked by

- `docs/tickets/local-executable-monorepo-foundation/003-infraestrutura-local-e-health-checks.md`
- `docs/tickets/local-executable-monorepo-foundation/004-contrato-do-job-e-registro-de-filas.md`
- `docs/tickets/local-executable-monorepo-foundation/005-api-enfileira-job-de-verificacao.md`

## Result

Preencher durante a implementação com comportamento entregue, contratos, arquivos principais, decisões e validações executadas.
