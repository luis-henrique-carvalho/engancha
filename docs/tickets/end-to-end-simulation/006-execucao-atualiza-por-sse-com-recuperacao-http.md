---
title: "Execução atualiza por SSE com recuperação HTTP"
status: "completed"
type: "AFK"
parent: "docs/prds/end-to-end-simulation.md"
blocked_by:
  - "docs/tickets/end-to-end-simulation/002-worker-encontra-revisao-publicada-ou-ignora-comentario.md"
  - "docs/tickets/end-to-end-simulation/003-jornada-simulada-com-resposta-dm-e-link.md"
  - "docs/tickets/end-to-end-simulation/004-captura-email-termina-em-solicitacao-simulada.md"
  - "docs/tickets/end-to-end-simulation/005-falha-e-reprocessamento-preservam-idempotencia.md"
user_stories: [5]
---

## Parent

PRD `docs/prds/end-to-end-simulation.md`; cobre `FR-SIM-007`, aplica `RN-006` e atende à User Story 5.

## What to build

Entregar atualização autenticada em tempo real para uma execução. O endpoint SSE deve emitir snapshot inicial e mudanças em ordem de versão, sempre reconciliadas com PostgreSQL. O fluxo HTTP existente permanece suficiente para carregamento, refresh e recuperação após desconexão.

## Acceptance criteria

- [x] `GET /api/v1/simulations/executions/:id/events` autentica sessão/workspace e não abre stream para execução estrangeira.
- [x] O stream emite snapshot inicial e atualizações user-safe em ordem monotônica de versão para `PENDING`, `PROCESSING` e estados terminais.
- [x] Saídas persistidas aparecem nos eventos em ordem sem depender de payload de fila ou memória local do worker.
- [x] O estado terminal `COMPLETED`, `IGNORED` ou `FAILED` é emitido integralmente antes do encerramento normal do stream.
- [x] Heartbeats e limites de conexão são explícitos, não viram atividade de produto e não expõem infraestrutura.
- [x] Redis/notification pode apenas sinalizar mudança; a API lê ou reconcilia PostgreSQL antes de emitir cada estado de produto.
- [x] O contrato permite que o cliente recarregue por GET e reconecte quando a execução ainda não for terminal, sem interpretar perda de SSE como falha da execução.
- [x] Testes de contrato e E2E cobrem snapshot, progresso, terminal, autenticação, isolamento, desconexão, reconexão, perda de sinal e PostgreSQL como fonte de verdade.

## Blocked by

- `docs/tickets/end-to-end-simulation/002-worker-encontra-revisao-publicada-ou-ignora-comentario.md`
- `docs/tickets/end-to-end-simulation/003-jornada-simulada-com-resposta-dm-e-link.md`
- `docs/tickets/end-to-end-simulation/004-captura-email-termina-em-solicitacao-simulada.md`
- `docs/tickets/end-to-end-simulation/005-falha-e-reprocessamento-preservam-idempotencia.md`

## Result

- Endpoint SSE implementado em `SimulationsController` (`GET /api/v1/simulations/executions/:id/events`) com o decorator `@Sse` do NestJS e proteção via `AuthorizationContextGuard`.
- Validação multi-tenant: execuções inexistentes ou pertencentes a outro workspace são rejeitadas com 404 antes de estabelecer o stream.
- Emissão progressiva e reconciliada: o stream emite o snapshot inicial (`type: 'snapshot'`), seguido por atualizações (`type: 'update'`) em ordem monotônica de `stateVersion` lidas diretamente do PostgreSQL, e heartbeats periódicos explícitos (`type: 'heartbeat'`).
- Encerramento limpo: execuções em estado terminal (`COMPLETED`, `IGNORED`, `FAILED`) emitem o evento terminal completo antes da finalização normal do stream.
- Resiliência e recuperação HTTP: o endpoint `GET /api/v1/simulations/executions/:id` permanece autoritativo para recarga e reconciliação após desconexões transitórias.
- Contratos e OpenAPI: adicionados schemas `simulationSseHeartbeatSchema` e `simulationSseEventSchema` em `@engancha/contracts` e registrada a rota SSE no OpenAPI.
- Testes: cobertura completa E2E em `apps/api/src/modules/simulations/simulations.e2e-spec.ts` validando autenticação, isolamento, snapshot, ordenação monotônica, emissão terminal, heartbeats e desconexão/reconexão.
