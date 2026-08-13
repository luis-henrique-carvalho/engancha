---
title: "Infraestrutura local e health checks"
status: "done"
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

- [x] PostgreSQL e Redis sobem por Docker Compose e reportam estado saudável.
- [x] O health check da API evidencia a disponibilidade da própria aplicação, PostgreSQL e Redis sem vazar segredos.
- [x] O worker valida sua conexão com Redis e registra prontidão somente quando puder consumir filas.
- [x] Dependência indisponível aparece claramente no health/readiness e impede operações dependentes.
- [x] Testes de integração ou validações controladas cobrem os estados saudável e indisponível.

## Blocked by

`docs/tickets/local-executable-monorepo-foundation/002-runtime-nest-configuracao-e-operacao.md`

## Result

Implementada a infraestrutura local de PostgreSQL e Redis em `docker-compose.yml`, com volumes nomeados, portas configuráveis e health checks funcionais (`pg_isready` e `redis-cli ping`). Adicionado `.env.example` com defaults locais seguros e documentação de inicialização, consulta e encerramento no `README.md`, sem schema, migrations ou persistência de domínio.

A API agora expõe `GET /api/v1/health` e `GET /api/v1/health/ready`, retornando `200` somente quando aplicação, PostgreSQL e Redis estão disponíveis. `GET /api/v1/health/live` cobre liveness da aplicação. O readiness retorna `503` quando uma dependência falha e só expõe estados `up`/`down`, timestamp e nome do serviço, sem URLs, credenciais ou mensagens de erro externas. O pool PostgreSQL é encerrado no lifecycle da aplicação.

O worker possui probe Redis próprio e executa `assertReady()` antes de registrar o evento estruturado `ready`; uma conexão indisponível interrompe o bootstrap com erro sanitizado. API e worker mantêm os adapters locais separados, sem importar detalhes de runtime entre si.

Arquivos principais: `docker-compose.yml`, `.env.example`, `README.md`, `apps/api/src/health/health.controller.ts`, `apps/api/src/infrastructure/infrastructure-health.service.ts`, `apps/api/src/infrastructure/redis-probe.ts`, `apps/worker/src/infrastructure/redis-readiness.service.ts`, `apps/worker/src/infrastructure/redis-probe.ts` e `tests/infra-health.test.mjs`.

Validações executadas:

- `npm test` — 11 testes passaram, incluindo estados saudável/indisponível, ausência de vazamento e readiness do worker.
- `npm run typecheck` — API, web, worker e contracts passaram.
- `npm run lint` e `npm run format:check` — passaram.
- `npm run build --workspace=@engancha/api` e `npm run build --workspace=@engancha/worker` — passaram.
- `docker compose config --quiet` — configuração válida.
- `docker compose up -d` e `docker compose ps` — PostgreSQL e Redis reportaram `healthy`.
- API real respondeu `200` em `/api/v1/health` e `/api/v1/health/ready` com ambos os checks `up`; ao parar PostgreSQL, `/api/v1/health/ready` respondeu `503` com `postgres: down` e sem segredos.
- Worker real registrou `ready` após o probe Redis e registrou shutdown ordenado ao SIGINT.
- Containers temporários da validação foram removidos com `docker compose down`; volumes nomeados foram preservados.
