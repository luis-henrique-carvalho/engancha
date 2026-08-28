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

## Result

### Comportamento entregue

- **Busca textual**: campo de busca na toolbar filtra automações por nome da revisão (case-insensitive) ou pela `keywordNormalized` do trigger (normalizada via `normalizeAutomationKeyword`). Cada keystroke chama `onParamsChange` com `{ query: '<valor>' }`.
- **Filtro de status**: filtro facetado com as opções Ativa (`ACTIVE`), Rascunho (`DRAFT`) e Pausada (`PAUSED`). Suporta seleção múltipla. Um único valor na URL é aceito como string (o schema faz coerção de `string | string[]` → `string[]`).
- **Reset**: botão "Reset" na toolbar aparece quando há filtros ativos e restaura `{ query: undefined, status: undefined }`.
- **URL state**: `validateSearch` na rota `/automations` lê `query` e `status` da URL e os propaga como `AutomationListRequest` para toda a cadeia view → hook → api.
- **Isolamento multi-tenant**: o filtro Prisma sempre inclui `organizationId`, garantindo que automações de outros workspaces nunca apareçam nos resultados.

### Diagrama de fluxo

```mermaid
flowchart LR
    URL["URL ?query=&status="] -->|validateSearch| Route
    Route -->|params: AutomationListRequest| View["AutomationsListView"]
    View -->|filters, onFiltersChange| Table["AutomationTable"]
    Table -->|globalFilter / columnFilters| Toolbar["DataTableToolbar"]
    Toolbar -->|onReset / onFilterChange| Table
    Table -->|onFiltersChange| View
    View -->|onParamsChange| Route
    Route -->|navigate| URL
    View -->|params| Hook["useAutomationsList"]
    Hook -->|AutomationListRequest| Api["AutomationsApi.list"]
    Api -->|GET /automations?query=&status=| Backend["AutomationsController"]
    Backend -->|AutomationListRequest| Service["AutomationsService"]
    Service -->|organizationId + input| Repo["PrismaAutomationRepository"]
    Repo -->|where: {status in, revisions name/keyword}| DB["Postgres"]
```

### Principais arquivos e responsabilidades

| Arquivo | Responsabilidade |
|---|---|
| `packages/contracts/src/index.ts` | `automationListRequestSchema`: define `page`, `limit`, `query?`, `status?` (aceita string ou array → normaliza para array). |
| `apps/api/…/automations.controller.ts` | Troca `paginationRequestSchema` por `automationListRequestSchema` no `@Query()` do endpoint `GET /automations`. |
| `apps/api/…/prisma-automation.repository.ts` | Constrói `where` com `status: { in: … }` e busca via `OR` em `revisions.name` e `revisions.trigger.keywordNormalized`. |
| `apps/api/…/openapi.ts` | Registra `automationListRequestSchema` na documentação OpenAPI do endpoint de listagem. |
| `apps/web/…/automations-api.ts` | Serializa `query` e `status[]` para URLSearchParams, incluindo arrays como múltiplos pares chave-valor. |
| `apps/web/…/automations-query-keys.ts` | Query key usa `AutomationListRequest` para invalidação e cache granulares por parâmetros. |
| `apps/web/…/use-automations-list.ts` | Hook `useQuery` tipado com `AutomationListRequest`. |
| `apps/web/…/automation-table.tsx` | Recebe `filters`/`onFiltersChange` como props; controla `globalFilter` e `columnFilters` via props (controlado); expõe `DataTableToolbar` com `searchPlaceholder` e opções de status. |
| `apps/web/…/automation-status-options.ts` | Constante com as 3 opções do filtro facetado (excluindo ARCHIVED). |
| `apps/web/…/automations-list-view.tsx` | Faz ponte entre `params` (da rota) e `AutomationTable`, propagando reset e mudanças de filtro. |
| `apps/web/src/routes/automations/index.tsx` | `validateSearch` parseia `query` e `status` da URL; `navigate` persiste estado de filtros na URL. |
| `apps/api/…/automations.e2e-spec.ts` | 2 novos testes: filtro por `status=ACTIVE/DRAFT` e busca textual por nome e keyword. |
| `apps/web/…/automations-list-view.test.tsx` | 3 novos testes DOM: digitação na busca, seleção de status, reset com filtros ativos. |

### Decisões relevantes

- **Schema aceita string ou array para `status`**: `GET /automations?status=ACTIVE` (string) e `GET /automations?status=ACTIVE&status=DRAFT` (array) são igualmente válidos — coerção feita no schema com `z.union([string, array]).transform(...)`.
- **`AutomationTable` é totalmente controlado**: `globalFilter` e `columnFilters` vêm de props, não de estado local. Isso garante que a URL seja sempre a fonte da verdade, mas implica que cada keystroke dispara `onParamsChange` individualmente (sem debounce neste ticket).
- **Busca normalizada por `keywordNormalized`**: para palavras-chave, a busca usa o campo `keywordNormalized` (já normalizado em persist) com `contains + normalizeAutomationKeyword(query)`, garantindo correspondência case/accent-insensitive.
- **Opções de status excluem ARCHIVED**: o filtro facetado omite o status `ARCHIVED` intencionalmente, pois automações arquivadas não são parte do fluxo operacional normal.

### Validações executadas

- `npm run test:automations:e2e` → **10/10 passing** (8 existentes + 2 novos)
- `npm run web:test` → **189/189 passing** (186 existentes + 3 novos)
