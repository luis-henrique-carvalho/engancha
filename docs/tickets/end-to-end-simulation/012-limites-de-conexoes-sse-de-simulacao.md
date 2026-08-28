---
title: "Limites de conexões SSE de simulação"
status: "needs-triage"
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

- [ ] O endpoint SSE aplica limites simultâneos explícitos por membro/workspace e globais por processo, com valores configuráveis e defaults seguros.
- [ ] A autorização e a existência da execução são verificadas antes da reserva; uma execução estrangeira continua retornando `404` e não consome vaga.
- [ ] Quando a capacidade estiver esgotada, a API retorna uma resposta segura e estável sem abrir stream, assinatura Redis, heartbeat ou outros recursos associados.
- [ ] Encerramento terminal, timeout, cancelamento e desconexão liberam a vaga exatamente uma vez; uma nova conexão passa a ser aceita após a liberação.
- [ ] O limite não altera a ordem de `stateVersion`, o snapshot inicial nem a recuperação HTTP/reconexão de uma execução não terminal.
- [ ] Testes E2E cobrem os limites por escopo e globais, rejeição sem vazamento de recursos, liberação em todos os caminhos de encerramento e isolamento entre workspaces.
- [ ] Typecheck, lint, formatter e testes relevantes são executados e registrados em `Result`.
- [ ] A seção `Result` documenta o comportamento entregue, os principais arquivos ou contratos, decisões e limites relevantes e as validações executadas.

## Blocked by

None - can start immediately.
