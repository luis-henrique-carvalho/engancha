---
title: "Jornada simulada com resposta, DM e link"
status: "completed"
type: "AFK"
parent: "docs/prds/end-to-end-simulation.md"
blocked_by: ["docs/tickets/end-to-end-simulation/002-worker-encontra-revisao-publicada-ou-ignora-comentario.md"]
user_stories: [3, 8, 9]
---

## Parent

PRD `docs/prds/end-to-end-simulation.md`; cobre `FR-SIM-003` a `FR-SIM-005`, amplia `FR-SIM-007`, aplica `RN-003` a `RN-005` e atende às User Stories 3, 8 e 9.

## What to build

Completar o primeiro caminho positivo do worker para uma revisão cuja ação final é `LINK`. Processar as ações publicadas em ordem, persistir saídas próprias da execução para resposta pública, DM e entrega do link, e disponibilizar a jornada completa pelo endpoint de consulta, sem criar conversa/mensagem nem realizar chamadas externas.

## Acceptance criteria

- [x] O worker valida `ChannelCapabilities` do Instagram simulado antes de executar o snapshot.
- [x] Resposta pública, DM e entrega de link são processadas na ordem publicada e persistidas com identidades determinísticas por execução/ação.
- [x] A execução avança por `PROCESSING` e termina em `COMPLETED` com timestamps e versão de estado atualizados.
- [x] `GET /api/v1/simulations/executions/:id` retorna input, snapshot resumido e saídas ordenadas com marcação inequívoca de simulação.
- [x] Nenhuma `Conversation`, `Message`, `Contact`, `Lead`, `Tag` ou `ChannelConnection` é criada e nenhum tráfego externo ocorre.
- [x] Redelivery do mesmo job reconhece a execução/saídas já persistidas e não duplica resposta, DM ou link.
- [x] Testes unitários, Prisma, worker, API e E2E comprovam ordem, payloads validados, conclusão, idempotência e ausência de efeitos externos/Fase 5.

## Blocked by

- `docs/tickets/end-to-end-simulation/002-worker-encontra-revisao-publicada-ou-ignora-comentario.md`

## Result

Entregue o primeiro caminho positivo completo da jornada simulada com resposta pública, DM e link:

- **Contratos (`@engancha/contracts`)**:
  - `channelCapabilitiesSchema`, `ChannelCapabilities` e `getChannelCapabilities()` declarando as capacidades de execução suportadas por provider e modo.
  - `executionOutputTypeSchema` (`PUBLIC_REPLY`, `PRIVATE_REPLY`, `LINK_DELIVERY`, `EMAIL_CAPTURE_REQUEST`).
- **Worker (`@engancha/worker`)**:
  - Validação obrigatória de `ChannelCapabilities` antes do processamento das ações do snapshot; se houver ação incompatível, falha determinística com `UNSUPPORTED_CHANNEL_ACTION`.
  - Mapeamento determinístico das ações ordenadas por posição para `AutomationExecutionOutputDraft` com chaves únicas `${executionId}:${position}:${type}` e payload com marcação `simulated: true`.
  - `PrismaAutomationExecutionRepository.saveExecutionCompleted()` com transação atômica (`$transaction`): atualiza a execução para `COMPLETED`, registra `completedAt`, incrementa `stateVersion` e executa `upsert` idempotente de cada saída em `AutomationExecutionOutput`.
- **API (`@engancha/api`)**:
  - `GET /api/v1/simulations/executions/:id` expõe o snapshot imutável e a lista de saídas ordenadas por posição, com marcação `simulated: true`.
- **Validações e Testes**:
  - `npm run typecheck` — passou sem erros.
  - `npm run lint` — passou sem erros.
  - `tests/automations-contracts-domain.test.mjs` — 7 testes cobrindo capacidades, contratos e validações.
  - `tests/worker-automation-execution.test.mjs` — 8 testes cobrindo processador, consumidor, claim condicional, matching, no-match, múltiplos matches, validação de capacidades e persistência de saídas.
  - `npm run test:simulations:e2e` — 10 testes de integração e E2E cobrindo jornada positiva com `PUBLIC_REPLY` + `LINK_DELIVERY`, `CAPTURE_EMAIL`, redelivery sem duplicações e ausência de efeitos colaterais externos/Fase 5.
