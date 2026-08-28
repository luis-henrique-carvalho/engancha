---
title: "Limites de requisição para operações de simulação"
status: "completed"
type: "AFK"
parent: "docs/prds/end-to-end-simulation.md"
blocked_by: []
user_stories: [1, 5, 7, 9]
---

## Parent

PRD `docs/prds/end-to-end-simulation.md`; fecha o requisito de qualidade que protege os endpoints de simulação sem alterar o fluxo determinístico de idempotência, retry ou reconexão.

## What to build

Aplicar limites de requisição explícitos às operações HTTP de simulação. Um membro autenticado deve poder testar e recuperar execuções normalmente, mas solicitações repetidas ou abusivas devem receber uma resposta estável e segura antes de criar carga desproporcional no PostgreSQL, BullMQ ou worker.

O slice abrange `POST /simulations/comments`, `POST /simulations/executions/:id/retry` e `GET /simulations/executions` (incluindo consultas individuais quando a política compartilhada exigir). Os limites devem usar uma chave de escopo segura derivada da sessão e do workspace ativo, ter valores configuráveis por ambiente e manter a semântica da chave de idempotência: uma repetição válida não pode criar outra execução, e o bloqueio não pode expor IDs, payloads ou dados de outro workspace.

## Acceptance criteria

- [x] Os endpoints de criação, retry e consulta de simulações têm política de rate limit explícita, configurável e documentada, aplicada depois da autenticação e do contexto do workspace.
- [x] A chave de limitação diferencia adequadamente membros ou sessões e o workspace ativo, sem aceitar identificadores enviados pelo browser como evidência de autorização.
- [x] Ao exceder o limite, a API retorna `429 Too Many Requests` com código e mensagem seguros, sem criar execução, enfileirar job ou alterar o estado de retry.
- [x] Uma submissão idempotente dentro do limite preserva o `executionId` existente e não cria um novo ciclo lógico de enfileiramento.
- [x] As políticas não bloqueiam a reconciliação HTTP necessária após uma desconexão SSE dentro do uso normal previsto.
- [x] Testes E2E cobrem o limite, a recuperação após a janela, isolamento entre workspaces e a ausência de efeitos persistentes ou de fila após uma rejeição.
- [x] Typecheck, lint, formatter e testes relevantes são executados e registrados em `Result`.
- [x] A seção `Result` documenta o comportamento entregue, os principais arquivos ou contratos, decisões e limites relevantes e as validações executadas.

## Blocked by

None - can start immediately.

## Result

### Comportamento entregue

- Adicionado `@nestjs/throttler` com configuração assíncrona via `ConfigModule`/`ConfigService`, seguindo o padrão oficial do NestJS.
- Criadas três políticas independentes e configuráveis: criação (`5` requisições/`60s`), retry (`5`/`60s`) e leitura (`20`/`60s`), com bloqueio de `1s` após exceder o limite.
- Aplicado `SimulationRateLimitGuard` depois do `AuthorizationContextGuard` nos endpoints `POST /simulations/comments`, `POST /simulations/executions/:id/retry`, `GET /simulations/executions` e `GET /simulations/executions/:id`.
- A chave usa somente `userId`, `organizationId` e `membershipId` derivados do `authorizationContext` preenchido no servidor; IDs enviados pelo browser não são usados como autorização.
- O excesso retorna `429` com `code: SIMULATION_RATE_LIMIT_EXCEEDED`, mensagem genérica segura e header `Retry-After`. A rejeição acontece antes do pipe/handler de simulação, portanto não cria execução, não enfileira job e não modifica retry.
- O SSE (`GET /simulations/executions/:id/events`) não recebe o guard de rate limit, preservando reconexão e recuperação HTTP normais. A idempotência existente continua preservando o mesmo `executionId` e uma única entrada na fila.

### Arquivos e responsabilidades

- `apps/api/src/modules/simulations/api/http/simulation-rate-limit.guard.ts`: políticas, chave por contexto autenticado e resposta segura de throttling.
- `apps/api/src/modules/simulations/simulations.module.ts`: configuração `ThrottlerModule.forRootAsync()` e registro do guard na feature.
- `apps/api/src/modules/simulations/api/http/simulations.controller.ts`: aplicação declarativa das políticas por endpoint, mantendo o SSE fora do limite.
- `apps/api/src/platform/config/runtime-env.ts` e `.env.example`: defaults, validação e variáveis de ambiente.
- `apps/api/src/platform/http/openapi/shared.ts` e `apps/api/src/modules/simulations/api/http/openapi.ts`: documentação do `429` e `Retry-After`.
- `apps/api/src/modules/simulations/simulations.e2e-spec.ts`: cenários de limite de criação/leitura/retry, isolamento por workspace, recuperação, ausência de efeitos e reconciliação SSE.

### Decisões e limites

- A política é aplicada como guard de rota após a autorização de workspace, aproveitando a ordem de execução documentada pelo NestJS; isso permite uma chave tenant-aware sem confiar em parâmetros do cliente.
- O storage padrão do `@nestjs/throttler` é em memória, adequado ao runtime local de uma instância desta fase. Em uma implantação horizontal, o provider `ThrottlerStorage` deverá ser substituído por storage compartilhado Redis.
- `ttl` e `blockDuration` são expressos em milissegundos, conforme a versão atual do pacote; `Retry-After` é expresso em segundos.

### Validações executadas

- `npm run typecheck --workspace=@engancha/api` — passou.
- `npm run build --workspace=@engancha/api` — passou.
- `npm run test:simulations:e2e` — passou, 22/22 testes com PostgreSQL e Redis locais.
- `npm run test:openapi:e2e` — passou, 2/2 testes do contrato/documentação OpenAPI.
- `npm run lint` — passou sem erros; permanecem somente 2 warnings preexistentes no frontend.
- `npm run format:check` — passou.

Referências consultadas: [NestJS Rate Limiting](https://docs.nestjs.com/security/rate-limiting), [NestJS Guards](https://docs.nestjs.com/guards) e [NestJS Request Lifecycle](https://docs.nestjs.com/faq/request-lifecycle).
