---
title: "Limites de conexões SSE de simulação"
status: "done"
type: "AFK"
parent: "docs/prds/end-to-end-simulation.md"
blocked_by: []
user_stories: [5, 9]
---

## Parent

PRD `docs/prds/end-to-end-simulation.md`; fecha o requisito de qualidade de limitar conexões SSE, preservando PostgreSQL como fonte de verdade e a recuperação por HTTP.

## What to build

Limitar conexões simultâneas do endpoint `GET /simulations/executions/:id/events` por escopo autenticado (membro e workspace) e por processo da API. O controle deve reservar a vaga antes de abrir o stream, liberar a vaga em encerramento terminal, timeout, cancelamento ou desconexão do cliente e permitir que o cliente continue recuperando a projeção pelo endpoint HTTP.

Quando o limite for excedido, a API deve rejeitar a nova tentativa com resposta segura e orientada à reconexão, sem abrir assinatura Redis, timer de heartbeat ou stream parcial. Os valores devem ser explícitos e configuráveis por ambiente; a duração máxima existente é complementar e não substitui o limite de simultaneidade.

## Acceptance criteria

- [x] O endpoint SSE aplica limites simultâneos explícitos por membro/workspace e globais por processo, com valores configuráveis e defaults seguros.
- [x] A autorização e a existência da execução são verificadas antes da reserva; uma execução estrangeira continua retornando `404` e não consome vaga.
- [x] Quando a capacidade estiver esgotada, a API retorna uma resposta segura e estável sem abrir stream, assinatura Redis, heartbeat ou outros recursos associados.
- [x] Encerramento terminal, timeout, cancelamento e desconexão liberam a vaga exatamente uma vez; uma nova conexão passa a ser aceita após a liberação.
- [x] O limite não altera a ordem de `stateVersion`, o snapshot inicial nem a recuperação HTTP/reconexão de uma execução não terminal.
- [x] Testes E2E cobrem os limites por escopo e globais, rejeição sem vazamento de recursos, liberação em todos os caminhos de encerramento e isolamento entre workspaces.
- [x] Typecheck, lint, formatter e testes relevantes são executados e registrados em `Result`.
- [x] A seção `Result` documenta o comportamento entregue, os principais arquivos ou contratos, decisões e limites relevantes e as validações executadas.

## Blocked by

None - can start immediately.

## Result

### Comportamento Entregue
Implementada a camada de controle de limites de conexões simultâneas SSE para simulações (`GET /simulations/executions/:id/events`), operando com isolamento por escopo autenticado (membro/workspace: `organizationId:membershipId`) e limite global por processo de API.

1. **Validação Prévia e Isolamento de Recursos**:
   - A autorização e a existência da execução no workspace são verificadas antes de qualquer reserva de conexão. Se a execução não pertencer ao workspace ou não existir, a API retorna `404 Not Found` sem alocar vaga.
   - Ao atingir o limite por membro/workspace ou limite global, a API lança `HttpException` (`429 Too Many Requests`) com payload sanitizado (`SIMULATION_RATE_LIMIT_EXCEEDED`) e cabeçalho `Retry-After: 5`, sem abrir stream, sem iniciar heartbeat e sem criar subscription no Redis Pub/Sub.

2. **Ciclo de Vida e Liberação Idempotente de Leases**:
   - Criada a porta [`SimulationSseConnectionTracker`](file:///home/luis/Documentos/Git/Engancha/apps/api/src/modules/simulations/domain/ports/simulation-sse-connection-tracker.port.ts) com suporte a leases rastreáveis (`release()`).
   - A liberação da vaga ocorre exatamente uma vez em todos os caminhos de encerramento:
     - Encerramento terminal inicial (execução já concluída ao conectar).
     - Atualização terminal durante o stream (`COMPLETED`, `IGNORED`, `FAILED`).
     - Timeout de duração máxima do stream (`maxDurationMs`).
     - Cancelamento ou desconexão do cliente (`unsubscribe` RxJS / fechamento TCP/SSE).
     - Falha na assinatura Redis.

3. **Garantia de Recuperação por HTTP**:
   - Quando o limite de conexões SSE é atingido, o endpoint autoritativo `GET /simulations/executions/:id` continua respondendo `200 OK` com o snapshot completo e `stateVersion` intacto, permitindo que a aplicação frontend consulte o estado e se recupere sem bloqueios.

### Arquivos e Contratos
- [`apps/api/src/modules/simulations/domain/ports/simulation-sse-connection-tracker.port.ts`](file:///home/luis/Documentos/Git/Engancha/apps/api/src/modules/simulations/domain/ports/simulation-sse-connection-tracker.port.ts): Declaração da porta `SIMULATION_SSE_CONNECTION_TRACKER`, do contrato `SimulationSseConnectionTracker` e do tipo `SimulationSseLease`.
- [`apps/api/src/modules/simulations/infrastructure/security/in-memory-simulation-sse-connection-tracker.ts`](file:///home/luis/Documentos/Git/Engancha/apps/api/src/modules/simulations/infrastructure/security/in-memory-simulation-sse-connection-tracker.ts): Implementação in-memory com contadores atômicos e liberação idempotente com limpeza de chaves vazias.
- [`apps/api/src/platform/config/runtime-env.ts`](file:///home/luis/Documentos/Git/Engancha/apps/api/src/platform/config/runtime-env.ts): Variáveis de ambiente `SIMULATION_SSE_MAX_CONCURRENT_PER_MEMBER` (default: 5) e `SIMULATION_SSE_MAX_CONCURRENT_GLOBAL` (default: 100).
- [`apps/api/src/platform/http/global-exception.filter.ts`](file:///home/luis/Documentos/Git/Engancha/apps/api/src/platform/http/global-exception.filter.ts): Fallback seguro garantindo cabeçalho `Retry-After: 5` para todas as respostas HTTP 429.
- [`apps/api/src/modules/simulations/application/simulations.service.ts`](file:///home/luis/Documentos/Git/Engancha/apps/api/src/modules/simulations/application/simulations.service.ts): Integração da reserva e liberação da vaga no fluxo SSE, com log estruturado `simulation_stream_connection_limit_exceeded`.
- [`apps/api/src/modules/simulations/simulations.module.ts`](file:///home/luis/Documentos/Git/Engancha/apps/api/src/modules/simulations/simulations.module.ts): Registro e exportação do provider `SIMULATION_SSE_CONNECTION_TRACKER`.
- [`tests/simulation-sse-tracker.test.mjs`](file:///home/luis/Documentos/Git/Engancha/tests/simulation-sse-tracker.test.mjs): Testes unitários do tracker e isolamento de escopos.
- [`apps/api/src/modules/simulations/simulations.e2e-spec.ts`](file:///home/luis/Documentos/Git/Engancha/apps/api/src/modules/simulations/simulations.e2e-spec.ts): Testes ponta a ponta validando limites simultâneos, rejeição sem leak de recursos, liberação em todos os caminhos e recuperação HTTP.

### Validações Executadas
- `npm run typecheck`: Sucesso (0 erros em todos os workspaces).
- `node --import tsx --test tests/simulation-sse-tracker.test.mjs`: 2 testes unitários passaram.
- `npm run test:simulations:e2e`: 25 testes E2E passaram.
- `npm test`: 85 testes da suíte completa passaram.
- `npm run lint`: 0 erros.
- `npm run format:check`: 100% formatado conforme Prettier.
- `npm run verify`: Sucesso integral em todas as etapas.

