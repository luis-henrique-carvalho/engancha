---
title: "Jornada simulada com resposta, DM e link"
status: "needs-triage"
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

- [ ] O worker valida `ChannelCapabilities` do Instagram simulado antes de executar o snapshot.
- [ ] Resposta pública, DM e entrega de link são processadas na ordem publicada e persistidas com identidades determinísticas por execução/ação.
- [ ] A execução avança por `PROCESSING` e termina em `COMPLETED` com timestamps e versão de estado atualizados.
- [ ] `GET /api/v1/simulations/executions/:id` retorna input, snapshot resumido e saídas ordenadas com marcação inequívoca de simulação.
- [ ] Nenhuma `Conversation`, `Message`, `Contact`, `Lead`, `Tag` ou `ChannelConnection` é criada e nenhum tráfego externo ocorre.
- [ ] Redelivery do mesmo job reconhece a execução/saídas já persistidas e não duplica resposta, DM ou link.
- [ ] Testes unitários, Prisma, worker, API e E2E comprovam ordem, payloads validados, conclusão, idempotência e ausência de efeitos externos/Fase 5.

## Blocked by

- `docs/tickets/end-to-end-simulation/002-worker-encontra-revisao-publicada-ou-ignora-comentario.md`

## Result

Preencher durante a implementação com comportamento entregue, jornada persistida, contratos, arquivos principais, decisões e validações executadas.
