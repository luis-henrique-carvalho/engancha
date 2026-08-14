---
title: "API enfileira job de verificação"
status: "done"
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

- [x] O endpoint é acessível somente no escopo de desenvolvimento configurado para a fundação.
- [x] Payloads inválidos são rejeitados antes de qualquer enfileiramento.
- [x] Payloads válidos são publicados na fila BullMQ correta com o contrato versionado.
- [x] A resposta permite correlacionar a solicitação ao job sem expor segredos ou payloads arbitrários.
- [x] Falhas de Redis ou da fila retornam erro estruturado e observável.
- [x] Testes cobrem sucesso, entrada inválida e falha de enfileiramento.

## Blocked by

- `docs/tickets/local-executable-monorepo-foundation/003-infraestrutura-local-e-health-checks.md`
- `docs/tickets/local-executable-monorepo-foundation/004-contrato-do-job-e-registro-de-filas.md`

## Result

Implementado em 2026-08-13.

### Comportamento entregue

- `POST /api/v1/dev/verification` fica disponível somente em `development` e `test`; em produção retorna `404`.
- O corpo deve ser o envelope estrito `VerificationJob` `v1`. A validação Zod ocorre antes de chamar BullMQ.
- Jobs válidos são publicados na fila técnica `verification` com `verificationJobOptions` (`3` tentativas, backoff exponencial e retenção limitada).
- A resposta contém somente `jobId` e `correlationId`. Falhas de fila/Redis retornam `503` com mensagem pública sanitizada.

### Arquivos principais

- `apps/api/src/verification/verification.controller.ts`
- `apps/api/src/verification/verification.service.ts`
- `apps/api/src/verification/verification.enqueuer.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/verification/verification.environment.ts`
- `tests/api-verification.test.mjs`
- `apps/api/package.json` e `package-lock.json`

### Validações executadas

- `npm run typecheck` — todos os workspaces passaram.
- `npm test` — 5 subtestes passaram, incluindo sucesso, rejeição antes do enfileiramento, ambiente de produção e falha de fila.
- `npm run lint` — passou.
- `npm run format:check` — passou.
- `npm run build --workspace=@engancha/api` — passou.
