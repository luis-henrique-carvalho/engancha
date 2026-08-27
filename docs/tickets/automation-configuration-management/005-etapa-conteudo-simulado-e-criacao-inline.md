---
title: "Etapa de conteúdo simulado e criação inline"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/automation-configuration-management.md"
blocked_by: ["docs/tickets/automation-configuration-management/004-etapa-identificacao-e-salvamento-explicito.md"]
user_stories: [3]
---

## Parent

PRD `docs/prds/automation-configuration-management.md`; cobre a User Story 3 (associação de exatamente um conteúdo simulado e criação inline de conteúdo para testes).

## What to build

Implementar a etapa 2 (Conteúdo):
1. Rota `/automations/:automationId/content` e view `content-step-view.tsx`.
2. Serviço `simulated-contents-api.ts` e hook `use-simulated-contents.ts` com query key `['workspaces', workspaceId, 'simulated-contents', params]`.
3. Componente seletor de conteúdo (`content-picker.tsx`) permitindo buscar e selecionar exatamente um item da lista.
4. Diálogo de criação inline de conteúdo simulado (`create-simulated-content-dialog.tsx`) baseado no padrão `UsersActionDialog`, com campos de título e identificador estável, fixando `provider: INSTAGRAM` e `mode: SIMULATED`.
5. Salvamento da associação de conteúdo-alvo via `PATCH /automations/:id` com `{ target: { contentId } }`.

## Acceptance criteria

- [ ] Lista de conteúdos simulados carregada a partir do workspace ativo.
- [ ] Usuário consegue selecionar um conteúdo existente para a automação.
- [ ] Usuário consegue abrir o modal, criar um novo conteúdo simulado (`POST /simulated-contents`), que é automaticamente selecionado após criação.
- [ ] Salvamento da etapa persiste o `target` selecionado no backend.
- [ ] Testes no DOM com Vitest Browser cobrindo listagem de conteúdos, seleção, abertura de modal, criação inline e persistência do target.
- [ ] A seção `Result` documenta o comportamento entregue, Diagrama Mermaid caso aplicável, os principais arquivos ou contratos, Responsabilidade de cada arquivo, explicações sobre conceitos (caso aplicável e necessário), decisões e limites relevantes e as validações executadas.

## Blocked by

- docs/tickets/automation-configuration-management/004-etapa-identificacao-e-salvamento-explicito.md
