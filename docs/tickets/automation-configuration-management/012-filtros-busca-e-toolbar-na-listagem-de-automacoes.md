---
title: "Filtros por status, busca textual e toolbar na listagem de automações"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/automation-configuration-management.md"
blocked_by: ["docs/tickets/automation-configuration-management/011-protecao-de-navegacao-com-alteracoes-nao-salvas.md"]
user_stories: [1]
---

## Parent

PRD `docs/prds/automation-configuration-management.md`; estende a listagem de automações com capacidades de busca textual, filtragem facetada por status e controle de visibilidade de colunas via `DataTableToolbar`.

## What to build

Implementar busca textual, filtros por status e barra de ferramentas na tabela de automações:
1. **Contratos e Backend**:
   - Atualizar schema de consulta de automações (`automationListRequestSchema`) aceitando `query?: string` e `status?: AutomationStatus[]`.
   - Atualizar `PrismaAutomationRepository.list` para aplicar filtros no Prisma:
     - `status`: filtro `in` pelo array de status informados;
     - `query`: busca case-insensitive no `name` ou no `keyword` das revisões da automação.
2. **Frontend (`features/automations`)**:
   - Conectar `DataTableToolbar` ao `AutomationTable` com `searchPlaceholder="Buscar por nome ou palavra-chave..."`.
   - Adicionar filtro facetado de estado com opções: `ACTIVE` (Ativa), `DRAFT` (Rascunho) e `PAUSED` (Pausada).
   - Integrar filtros e paginação ao hook `useTableUrlState`, preservando o estado na URL do navegador.
   - Suporte a reset de filtros e alternância de visibilidade de colunas.
3. **Testes**:
   - Testes de integração na API NestJS para `GET /api/v1/automations` com `query` e `status`.
   - Testes no DOM com Vitest Browser cobrindo digitação na busca, seleção de badges de status, reset e atualização da listagem.

## Acceptance criteria

- [ ] Campo de busca na listagem filtra automações por nome ou palavra-chave.
- [ ] Filtro facetado permite selecionar um ou mais estados (`ACTIVE`, `DRAFT`, `PAUSED`).
- [ ] Estado dos filtros e busca é refletido e sincronizado na URL via `useTableUrlState`.
- [ ] Botão de reset restaura a listagem para o estado inicial sem filtros.
- [ ] Backend filtra registros respeitando estritamente o isolamento multi-tenant do workspace ativo.
- [ ] Testes de integração no backend e testes de DOM no Vitest Browser cobrindo busca, filtros e reset.
- [ ] A seção `Result` documenta o comportamento entregue, Diagrama Mermaid caso aplicável, os principais arquivos ou contratos, Responsabilidade de cada arquivo, explicações sobre conceitos (caso aplicável e necessário), decisões e limites relevantes e as validações executadas.

## Blocked by

- docs/tickets/automation-configuration-management/011-protecao-de-navegacao-com-alteracoes-nao-salvas.md
