---
title: "Infraestrutura local e health checks"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/local-executable-monorepo-foundation.md"
blocked_by:
  - "docs/tickets/local-executable-monorepo-foundation/002-runtime-nest-configuracao-e-operacao.md"
user_stories: [1, 2]
---

## Parent

PRD `local-executable-monorepo-foundation`; cobre as User Stories 1 e 2 e os critérios de aceite de PostgreSQL, Redis, Docker Compose, health checks e falhas seguras de dependências.

## What to build

Provisionar PostgreSQL e Redis por Docker Compose com health checks funcionais, integrar as verificações de disponibilidade à API e ao worker e fornecer configuração local segura por `.env.example`, sem criar schema ou persistência de domínio.

## Acceptance criteria

- [ ] PostgreSQL e Redis sobem por Docker Compose e reportam estado saudável.
- [ ] O health check da API evidencia a disponibilidade da própria aplicação, PostgreSQL e Redis sem vazar segredos.
- [ ] O worker valida sua conexão com Redis e registra prontidão somente quando puder consumir filas.
- [ ] Dependência indisponível aparece claramente no health/readiness e impede operações dependentes.
- [ ] Testes de integração ou validações controladas cobrem os estados saudável e indisponível.

## Blocked by

`docs/tickets/local-executable-monorepo-foundation/002-runtime-nest-configuracao-e-operacao.md`

## Result

Preencher durante a implementação com comportamento entregue, contratos, arquivos principais, decisões e validações executadas.
