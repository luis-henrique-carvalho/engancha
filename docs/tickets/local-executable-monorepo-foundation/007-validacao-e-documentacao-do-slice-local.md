---
title: "Validação e documentação do slice local"
status: "done"
type: "HITL"
parent: "docs/prds/local-executable-monorepo-foundation.md"
blocked_by:
  - "docs/tickets/local-executable-monorepo-foundation/001-monorepo-executavel-e-shell-web.md"
  - "docs/tickets/local-executable-monorepo-foundation/002-runtime-nest-configuracao-e-operacao.md"
  - "docs/tickets/local-executable-monorepo-foundation/003-infraestrutura-local-e-health-checks.md"
  - "docs/tickets/local-executable-monorepo-foundation/004-contrato-do-job-e-registro-de-filas.md"
  - "docs/tickets/local-executable-monorepo-foundation/005-api-enfileira-job-de-verificacao.md"
  - "docs/tickets/local-executable-monorepo-foundation/006-worker-processa-job-de-verificacao.md"
user_stories: [1, 2, 3]
---

## Parent

PRD `local-executable-monorepo-foundation`; cobre as User Stories 1, 2 e 3 e o critério de sucesso do percurso local completo.

## What to build

Consolidar a documentação de execução local e as validações automatizadas e manuais do slice, cobrindo inicialização de web, API, worker, PostgreSQL e Redis, health checks, disparo do job técnico, consumo pelo worker e leitura dos logs correlacionados.

## Acceptance criteria

- [x] A documentação apresenta comandos reproduzíveis para instalar, iniciar, verificar e encerrar o ambiente.
- [x] Há uma validação automatizada do percurso API → BullMQ → worker usando o contrato compartilhado.
- [x] A verificação manual confirma health checks, job processado e logs correlacionáveis.
- [x] A documentação descreve falhas esperadas para configuração incompleta e dependências indisponíveis.
- [x] O resultado é revisado contra todos os critérios de aceite da PRD antes de marcar o slice como concluído.

## Blocked by

- `docs/tickets/local-executable-monorepo-foundation/001-monorepo-executavel-e-shell-web.md`
- `docs/tickets/local-executable-monorepo-foundation/002-runtime-nest-configuracao-e-operacao.md`
- `docs/tickets/local-executable-monorepo-foundation/003-infraestrutura-local-e-health-checks.md`
- `docs/tickets/local-executable-monorepo-foundation/004-contrato-do-job-e-registro-de-filas.md`
- `docs/tickets/local-executable-monorepo-foundation/005-api-enfileira-job-de-verificacao.md`
- `docs/tickets/local-executable-monorepo-foundation/006-worker-processa-job-de-verificacao.md`

## Result

Implementada a validação final do slice local e consolidada a operação no `README.md`. A documentação agora cobre instalação, subida e encerramento de PostgreSQL/Redis, execução independente de web/API/worker, health checks, disparo do endpoint técnico e leitura dos eventos correlacionados do worker. Também registra falhas esperadas para configuração inválida, dependências indisponíveis, payload inválido e falha de enfileiramento, sem incentivar exposição de segredos.

Adicionado `tests/local-flow.test.mjs`, que percorre as fronteiras públicas do enfileirador da API e do processor do worker com o contrato Zod compartilhado, confirmando fila `verification`, `jobId`, correlação e processamento. Os scripts `api:start` e `worker:start` foram ajustados para executar os artefatos no caminho real gerado pelo build. A sequência manual documentada valida a mesma jornada contra BullMQ e Redis reais.

Arquivos principais: `README.md` e `tests/local-flow.test.mjs`.

Validações executadas:

- `npm test` — validações do contrato, API, worker, infraestrutura e percurso local automatizado.
- `npm run typecheck`, `npm run lint` e `npm run format:check`.
- `docker compose config --quiet` — passou.
- Verificação manual real: PostgreSQL e Redis ficaram `healthy`; liveness/readiness responderam `200`; `POST /api/v1/dev/verification` retornou `jobId: 1` e `correlationId: manual-local-123`; o worker registrou `job_received`, `job_processing` e `job_succeeded` com a mesma correlação; API e worker registraram shutdown ordenado.
- Revisão contra a PRD: os critérios de workspace, infraestrutura, runtime, health/readiness, contrato, enfileiramento, consumo, filas, documentação e falhas seguras estão cobertos pelos tickets `001`–`007`; o ticket `008` permanece independente e opcional.
