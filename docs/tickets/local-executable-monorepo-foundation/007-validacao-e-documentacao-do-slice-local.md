---
title: "Validação e documentação do slice local"
status: "needs-triage"
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

- [ ] A documentação apresenta comandos reproduzíveis para instalar, iniciar, verificar e encerrar o ambiente.
- [ ] Há uma validação automatizada do percurso API → BullMQ → worker usando o contrato compartilhado.
- [ ] A verificação manual confirma health checks, job processado e logs correlacionáveis.
- [ ] A documentação descreve falhas esperadas para configuração incompleta e dependências indisponíveis.
- [ ] O resultado é revisado contra todos os critérios de aceite da PRD antes de marcar o slice como concluído.

## Blocked by

- `docs/tickets/local-executable-monorepo-foundation/001-monorepo-executavel-e-shell-web.md`
- `docs/tickets/local-executable-monorepo-foundation/002-runtime-nest-configuracao-e-operacao.md`
- `docs/tickets/local-executable-monorepo-foundation/003-infraestrutura-local-e-health-checks.md`
- `docs/tickets/local-executable-monorepo-foundation/004-contrato-do-job-e-registro-de-filas.md`
- `docs/tickets/local-executable-monorepo-foundation/005-api-enfileira-job-de-verificacao.md`
- `docs/tickets/local-executable-monorepo-foundation/006-worker-processa-job-de-verificacao.md`

## Result

Preencher durante a implementação com comportamento entregue, contratos, arquivos principais, decisões e validações executadas.
