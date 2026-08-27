---
title: "Criação de rascunho e layout do editor guiado"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/automation-configuration-management.md"
blocked_by: ["docs/tickets/automation-configuration-management/002-listagem-de-automacoes-e-estado-vazio.md"]
user_stories: [2]
---

## Parent

PRD `docs/prds/automation-configuration-management.md`; cobre a User Story 2 (criação de rascunho de automação e estrutura de navegação do editor).

## What to build

Implementar a criação inicial de rascunho e a estrutura de layout do editor de automações:
1. Ação "Nova automação" na listagem que executa `POST /automations {}`, obtém a nova automação em estado `DRAFT` e redireciona para `/automations/:automationId/identification`.
2. Rotas aninhadas em `apps/web/src/routes/automations/$automationId/` com redirecionamento de `/automations/:automationId` para a primeira etapa (`identification`).
3. Layout do editor (`automation-editor-layout-view.tsx`, `automation-step-nav.tsx`) inspirado no layout `Settings` / `SidebarNav` da referência, com navegação vertical no desktop e horizontal/responsiva no mobile.
4. Hook e serviço para carregar o detalhe da automação (`use-automation.ts`, `automations-api.ts`) com query key `['workspaces', workspaceId, 'automations', 'detail', automationId]`.
5. Estrutura base de seção (`automation-step-section.tsx`) e barra de salvamento (`automation-save-bar.tsx`).

## Acceptance criteria

- [ ] Clique em "Nova automação" cria rascunho via API e navega para `/automations/:id/identification`.
- [ ] Acessar `/automations/:id` redireciona automaticamente para a etapa `/identification`.
- [ ] Layout do editor renderiza barra de navegação das etapas (Identificação, Conteúdo, Palavra-chave, Resposta pública, DM, Ação final, Revisão).
- [ ] Rota exibe loading e erro 404 caso a automação não exista no workspace ativo.
- [ ] Testes no DOM com Vitest Browser cobrindo criação de rascunho, redirecionamento e renderização do layout do editor.
- [ ] A seção `Result` documenta o comportamento entregue, Diagrama Mermaid caso aplicável, os principais arquivos ou contratos, Responsabilidade de cada arquivo, explicações sobre conceitos (caso aplicável e necessário), decisões e limites relevantes e as validações executadas.

## Blocked by

- docs/tickets/automation-configuration-management/002-listagem-de-automacoes-e-estado-vazio.md
