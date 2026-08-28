---
title: "Aba Atividade agrupa interações e recupera falhas"
status: "needs-triage"
type: "HITL"
parent: "docs/prds/end-to-end-simulation.md"
blocked_by:
  - "docs/tickets/end-to-end-simulation/005-falha-e-reprocessamento-preservam-idempotencia.md"
  - "docs/tickets/end-to-end-simulation/006-execucao-atualiza-por-sse-com-recuperacao-http.md"
  - "docs/tickets/end-to-end-simulation/007-aba-testar-apresenta-experiencia-do-seguidor.md"
user_stories: [6, 7]
---

## Parent

PRD `docs/prds/end-to-end-simulation.md`; cobre a experiência de `FR-SIM-007`, `FR-SIM-008` e as User Stories 6 e 7.

## What to build

Entregar a atividade persistida da automação de ponta a ponta: endpoint paginado por cursor, projeção agrupável e interface que apresenta comentários, respostas, ações finais, ignorados e falhas em linguagem de produto. Atualizações SSE modificam a entrada existente; retry de falha mantém a mesma interação na lista.

## Acceptance criteria

- [ ] `GET /api/v1/simulations/executions` lista somente o workspace ativo, aceita filtro de automação/origem de UI e usa paginação por cursor estável, mais recentes primeiro.
- [ ] A projeção inclui resumo de autor/comentário, conteúdo, simulação, automação correspondente quando houver, status, saídas ordenadas e erro sanitizado.
- [ ] Execuções iniciadas no detalhe atual sem match aparecem como “Sem correspondência”; a origem de UI não altera o matching.
- [ ] A interface agrupa interações em contexto temporal/da automação e permite expandir a jornada sem exibir payloads ou infraestrutura.
- [ ] SSE atualiza ou insere a mesma execução sem duplicar itens; reconexão recarrega a projeção PostgreSQL preservando dados visíveis quando possível.
- [ ] Apenas entradas `FAILED` oferecem retry; a ação conserva o item/executionId e reflete o retorno a processamento.
- [ ] Estados vazio, carregando, paginação, reconectando e erro são responsivos e acessíveis.
- [ ] Nenhuma superfície menciona job, worker, Redis, fila, stack trace ou identificador técnico desnecessário.
- [ ] Testes de API e web cobrem cursor, isolamento, agrupamento, ignorado, falha/retry, atualização SSE, reconexão, vazio e acessibilidade.
- [ ] Agrupamento, densidade, linguagem e compreensão dos estados recebem revisão humana antes do fechamento do ticket.

## Blocked by

- `docs/tickets/end-to-end-simulation/005-falha-e-reprocessamento-preservam-idempotencia.md`
- `docs/tickets/end-to-end-simulation/006-execucao-atualiza-por-sse-com-recuperacao-http.md`
- `docs/tickets/end-to-end-simulation/007-aba-testar-apresenta-experiencia-do-seguidor.md`

## Result

Preencher durante a implementação com comportamento entregue, evidências visuais, contratos/paginação, arquivos principais, revisão humana e validações executadas.
