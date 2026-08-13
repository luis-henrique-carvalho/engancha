---
title: "API enfileira job de verificação"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/local-executable-monorepo-foundation.md"
blocked_by:
  - "docs/tickets/local-executable-monorepo-foundation/003-infraestrutura-local-e-health-checks.md"
  - "docs/tickets/local-executable-monorepo-foundation/004-contrato-do-job-e-registro-de-filas.md"
user_stories: [3]
---

## Parent

PRD `local-executable-monorepo-foundation`; cobre a User Story 3 e os critérios de aceite do endpoint técnico, validação compartilhada, BullMQ e correlação segura.

## What to build

Adicionar à API um endpoint de verificação claramente separado dos contratos de produto e limitado ao desenvolvimento, validando a entrada pelo contrato compartilhado, enfileirando o job na fila técnica com retry/backoff e retornando uma confirmação com identificador de correlação sem revelar dados sensíveis.

## Acceptance criteria

- [ ] O endpoint é acessível somente no escopo de desenvolvimento configurado para a fundação.
- [ ] Payloads inválidos são rejeitados antes de qualquer enfileiramento.
- [ ] Payloads válidos são publicados na fila BullMQ correta com o contrato versionado.
- [ ] A resposta permite correlacionar a solicitação ao job sem expor segredos ou payloads arbitrários.
- [ ] Falhas de Redis ou da fila retornam erro estruturado e observável.
- [ ] Testes cobrem sucesso, entrada inválida e falha de enfileiramento.

## Blocked by

- `docs/tickets/local-executable-monorepo-foundation/003-infraestrutura-local-e-health-checks.md`
- `docs/tickets/local-executable-monorepo-foundation/004-contrato-do-job-e-registro-de-filas.md`

## Result

Preencher durante a implementação com comportamento entregue, contratos, arquivos principais, decisões e validações executadas.
