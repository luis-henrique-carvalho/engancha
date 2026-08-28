---
title: "Execução atualiza por SSE com recuperação HTTP"
status: "needs-triage"
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

- [ ] `GET /api/v1/simulations/executions/:id/events` autentica sessão/workspace e não abre stream para execução estrangeira.
- [ ] O stream emite snapshot inicial e atualizações user-safe em ordem monotônica de versão para `PENDING`, `PROCESSING` e estados terminais.
- [ ] Saídas persistidas aparecem nos eventos em ordem sem depender de payload de fila ou memória local do worker.
- [ ] O estado terminal `COMPLETED`, `IGNORED` ou `FAILED` é emitido integralmente antes do encerramento normal do stream.
- [ ] Heartbeats e limites de conexão são explícitos, não viram atividade de produto e não expõem infraestrutura.
- [ ] Redis/notification pode apenas sinalizar mudança; a API lê ou reconcilia PostgreSQL antes de emitir cada estado de produto.
- [ ] O contrato permite que o cliente recarregue por GET e reconecte quando a execução ainda não for terminal, sem interpretar perda de SSE como falha da execução.
- [ ] Testes de contrato e E2E cobrem snapshot, progresso, terminal, autenticação, isolamento, desconexão, reconexão, perda de sinal e PostgreSQL como fonte de verdade.

## Blocked by

- `docs/tickets/end-to-end-simulation/002-worker-encontra-revisao-publicada-ou-ignora-comentario.md`
- `docs/tickets/end-to-end-simulation/003-jornada-simulada-com-resposta-dm-e-link.md`
- `docs/tickets/end-to-end-simulation/004-captura-email-termina-em-solicitacao-simulada.md`
- `docs/tickets/end-to-end-simulation/005-falha-e-reprocessamento-preservam-idempotencia.md`

## Result

Preencher durante a implementação com comportamento entregue, protocolo SSE/reconexão, contratos, arquivos principais, decisões e validações executadas.
