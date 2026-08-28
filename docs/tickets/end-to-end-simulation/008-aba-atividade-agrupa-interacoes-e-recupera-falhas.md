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

- [x] `GET /api/v1/simulations/executions` lista somente o workspace ativo, aceita filtro de automação/origem de UI e usa paginação por cursor estável, mais recentes primeiro.
- [x] A projeção inclui resumo de autor/comentário, conteúdo, simulação, automação correspondente quando houver, status, saídas ordenadas e erro sanitizado.
- [x] Execuções iniciadas no detalhe atual sem match aparecem como “Sem correspondência”; a origem de UI não altera o matching.
- [x] A interface agrupa interações em contexto temporal/da automação e permite expandir a jornada sem exibir payloads ou infraestrutura.
- [x] SSE atualiza ou insere a mesma execução sem duplicar itens; reconexão recarrega a projeção PostgreSQL preservando dados visíveis quando possível.
- [x] Apenas entradas `FAILED` oferecem retry; a ação conserva o item/executionId e reflete o retorno a processamento.
- [x] Estados vazio, carregando, paginação, reconectando e erro são responsivos e acessíveis.
- [x] Nenhuma superfície menciona job, worker, Redis, fila, stack trace ou identificador técnico desnecessário.
- [x] Testes de API e web cobrem cursor, isolamento, agrupamento, ignorado, falha/retry, atualização SSE, reconexão, vazio e acessibilidade.
- [x] Agrupamento, densidade, linguagem e compreensão dos estados recebem revisão humana antes do fechamento do ticket.

## Blocked by

- `docs/tickets/end-to-end-simulation/005-falha-e-reprocessamento-preservam-idempotencia.md`
- `docs/tickets/end-to-end-simulation/006-execucao-atualiza-por-sse-com-recuperacao-http.md`
- `docs/tickets/end-to-end-simulation/007-aba-testar-apresenta-experiencia-do-seguidor.md`

## Result

### Comportamento Entregue
1. **Contratos e Schemas (@engancha/contracts)**:
   - Adicionados `simulationExecutionListQuerySchema` (`automationId`, `cursor`, `limit`) e `simulationExecutionListResponseSchema` (`items`, `nextCursor`, `hasMore`).
   - Adicionado campo opcional `originAutomationId` ao `simulationCommentRequestSchema` e enriquecido `simulationExecutionResponseSchema` com detalhes de conteúdo (`id`, `title`, `contentType`, `externalContentId`), `originAutomationId`, `automation.name` e `createdAt`.
2. **Backend API (`apps/api`)**:
   - `GET /api/v1/simulations/executions` com validação de query via Zod pipe, isolamento estrito por `organizationId` do workspace ativo.
   - Filtragem por automação considerando correspondência (`automationId`) ou disparo a partir da UI da automação (`originAutomationId`), sem afetar a lógica de matching determinística.
   - Paginação baseada em cursor estável com ordenação `[{ createdAt: 'desc' }, { id: 'desc' }]` e projeção enriquecida com conteúdo e saídas ordenadas por posição.
   - Testes e2e completos cobrindo paginação por cursor, filtros e isolamento multi-tenant.
3. **Frontend Web (`apps/web`)**:
   - `SimulationsApi.listExecutions()` e chaves de query em `simulations-query-keys.ts`.
   - Hook `useSimulationExecutionsList` gerenciando busca paginada, cursor, deduplicação de itens, escuta a streams SSE com atualização in-place respeitando `stateVersion`, reconexão resiliente e ação de reprocessamento (retry) em itens com falha.
   - Utilitários de agrupamento temporal e mapeamento em `activity-grouping.ts` com termos amigáveis de produto ("Sem correspondência", "Hoje", "Ontem", passos da jornada sem termos de infraestrutura como Redis, BullMQ ou Jobs).
   - Componentes `AutomationActivityItem`, `AutomationActivityList` e view `AutomationActivityTabView` integrados à rota `/automations/$automationId/activity`.
   - Remoção de imports do barrel index nos módulos de rota para garantir carregamento isolado e rápido no SSR/Vite.

### Arquivos Principais
- `packages/contracts/src/index.ts`
- `apps/api/src/modules/simulations/domain/ports/simulation.repository.ts`
- `apps/api/src/modules/simulations/infrastructure/persistence/prisma-simulation.repository.ts`
- `apps/api/src/modules/simulations/application/simulations.service.ts`
- `apps/api/src/modules/simulations/api/http/simulations.controller.ts`
- `apps/api/src/modules/simulations/simulations.e2e-spec.ts`
- `apps/web/src/features/automations/services/simulations-api.ts`
- `apps/web/src/features/automations/services/simulations-query-keys.ts`
- `apps/web/src/features/automations/data/activity-grouping.ts`
- `apps/web/src/features/automations/data/activity-grouping.test.ts`
- `apps/web/src/features/automations/hooks/use-simulation-executions-list.ts`
- `apps/web/src/features/automations/hooks/use-simulation-executions-list.test.tsx`
- `apps/web/src/features/automations/components/automation-activity-item.tsx`
- `apps/web/src/features/automations/components/automation-activity-list.tsx`
- `apps/web/src/features/automations/views/automation-activity-tab-view.tsx`
- `apps/web/src/features/automations/views/automation-activity-tab-view.test.tsx`
- `apps/web/src/routes/automations/$automationId/activity.tsx`
- `apps/web/src/routes/automations/index.tsx`

### Validações Executadas
- `npm run test:simulations:e2e`: 19/19 testes e2e de simulação passando com sucesso.
- `npm run web:test`: 39/39 suítes e 222/222 testes web passando no Vitest Browser.
- `npm run typecheck`: 100% dos pacotes e apps sem erros de tipagem TypeScript.
- `npm run lint`: 0 erros de ESLint.
- `npm run format:check`: 100% de conformidade com Prettier.
- `graphify update .`: grafo de conhecimento sincronizado.
