---
title: "Contrato do job e registro de filas"
status: "needs-triage"
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

- [ ] O contrato aceita payloads válidos e rejeita payloads inválidos de forma determinística.
- [ ] O contrato é exportado com versão e não depende de NestJS, Prisma, Redis ou BullMQ.
- [ ] As filas `email-delivery`, `automation-execution`, `message-delivery` e `analytics` são declaradas uma única vez e reutilizáveis.
- [ ] As opções do job de verificação são explícitas e conservadoras.
- [ ] Testes unitários cobrem schemas, versão e rejeição de entradas inválidas.

## Blocked by

`docs/tickets/local-executable-monorepo-foundation/001-monorepo-executavel-e-shell-web.md`

## Result

Preencher durante a implementação com comportamento entregue, contratos, arquivos principais, decisões e validações executadas.
