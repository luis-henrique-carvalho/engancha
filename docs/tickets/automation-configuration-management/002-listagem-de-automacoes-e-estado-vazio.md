---
title: "Listagem de automações e estado vazio"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/automation-configuration-management.md"
blocked_by: ["docs/tickets/automation-configuration-management/001-fundacao-web-shadcn-e-vitest-browser.md"]
user_stories: [1]
---

## Parent

PRD `docs/prds/automation-configuration-management.md`; cobre a User Story 1 (listagem das automações do workspace ativo com seus respectivos estados).

## What to build

Implementar a rota e a view de listagem de automações:
1. Rota TanStack Router `/automations` (`apps/web/src/routes/automations/index.tsx` e `route.tsx`).
2. Serviços de API (`automations-api.ts`), query keys isoladas por workspace (`['workspaces', workspaceId, 'automations', 'list', params]`) e hook `use-automations-list.ts`.
3. Tabela de automações (`automation-table.tsx`, `automation-columns.tsx`) baseada no padrão `TasksTable` / `TasksColumns` da referência, com colunas: Nome, Status, Conteúdo, Palavra-chave, Última atualização, Execuções, Leads e Ações.
4. Badge de status (`automation-status-badge.tsx`) suportando `DRAFT`, `ACTIVE`, `PAUSED` e `ACTIVE com hasUnpublishedChanges`.
5. Empty state acessível (`automations-empty-state.tsx`) e tratamento de estados de loading e erro.

## Acceptance criteria

- [ ] Rota `/automations` lista as automações do workspace ativo paginadas conforme contrato da API (`page`, `limit`).
- [ ] Tabela exibe colunas corretas e badge de status condizente com o estado da automação e revisões.
- [ ] Estado vazio exibido quando o workspace não possui nenhuma automação cadastrada.
- [ ] Estado de loading e tratamento de erro (401 redirecionando, 403 avisando restrição, erro genérico) exibidos com acessibilidade.
- [ ] Query keys isoladas por `workspaceId`.
- [ ] Testes no DOM real com Vitest Browser cobrindo loading, listagem populada, paginação e estado vazio.
- [ ] A seção `Result` documenta o comportamento entregue, Diagrama Mermaid caso aplicável, os principais arquivos ou contratos, Responsabilidade de cada arquivo, explicações sobre conceitos (caso aplicável e necessário), decisões e limites relevantes e as validações executadas.

## Blocked by

- docs/tickets/automation-configuration-management/001-fundacao-web-shadcn-e-vitest-browser.md
