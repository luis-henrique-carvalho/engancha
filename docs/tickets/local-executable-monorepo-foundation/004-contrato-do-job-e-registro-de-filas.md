---
title: "Contrato do job e registro de filas"
status: "done"
type: "AFK"
parent: "docs/prds/local-executable-monorepo-foundation.md"
blocked_by:
  - "docs/tickets/local-executable-monorepo-foundation/001-monorepo-executavel-e-shell-web.md"
user_stories: [3, 4]
---

## Parent

PRD `local-executable-monorepo-foundation`; cobre as User Stories 3 e 4 e os critérios de aceite do contrato Zod versionado, independência de runtime e declaração central das filas.

## What to build

Criar em `packages/contracts` o schema Zod versionado do job técnico de verificação, com identificador de correlação e payload mínimo, além de um registro central dos nomes das filas iniciais e das opções explícitas de retry, backoff e retenção do job técnico.

## Acceptance criteria

- [x] O contrato aceita payloads válidos e rejeita payloads inválidos de forma determinística.
- [x] O contrato é exportado com versão e não depende de NestJS, Prisma, Redis ou BullMQ.
- [x] As filas `email-delivery`, `automation-execution`, `message-delivery` e `analytics` são declaradas uma única vez e reutilizáveis.
- [x] As opções do job de verificação são explícitas e conservadoras.
- [x] Testes unitários cobrem schemas, versão e rejeição de entradas inválidas.

## Blocked by

`docs/tickets/local-executable-monorepo-foundation/001-monorepo-executavel-e-shell-web.md`

## Result

Implementado em 2026-08-13 na branch `feat/004-contrato-do-job-e-registro-de-filas`.

### Comportamento entregue

- `verificationJobSchema` valida um envelope estrito `{ version, correlationId, payload }`, com versão `v1`, correlação limitada a um identificador seguro e payload técnico mínimo sem campos de domínio.
- `queueNames` centraliza as filas `verification`, `email-delivery`, `automation-execution`, `message-delivery` e `analytics`, sem duplicar literais nos consumidores futuros.
- `verificationJobOptions` exporta `attempts: 3`, backoff exponencial de 1 segundo e retenção limitada para jobs concluídos e falhos.
- `@engancha/contracts` usa somente Zod como dependência de runtime; não importa NestJS, Prisma, Redis ou BullMQ.

### Arquivos principais

- `packages/contracts/src/index.ts`
- `packages/contracts/package.json`
- `package-lock.json`
- `tests/contracts-job.test.mjs`
- `tests/workspace-foundation.test.mjs`

### Decisões

- A fila `verification` é técnica e separada das quatro filas de domínio previstas para reutilização futura.
- O payload inicial é um objeto estrito vazio para provar o transporte sem antecipar semântica de `Automation`, `Execution`, `Organization` ou eventos de negócio.
- O contrato expõe somente tipos/valores portáveis e deixa a adaptação para opções BullMQ nos consumidores.

### Validações executadas

- `npm test` — 11 testes passaram.
- `npm run typecheck` — todos os workspaces passaram.
- `npm run lint` — passou.
- `npm run format:check` — passou.
- `npm run web:build` — passou.
- `git diff --check` — passou.
- `graphify update .` — grafo atualizado no worktree.
