---
title: "Etapa de identificação e salvamento explícito"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/automation-configuration-management.md"
blocked_by: ["docs/tickets/automation-configuration-management/003-criacao-de-rascunho-e-layout-do-editor.md"]
user_stories: [2, 4]
---

## Parent

PRD `docs/prds/automation-configuration-management.md`; cobre a configuração inicial do nome da automação e a mecânica de formulário por etapa com salvamento explícito.

## What to build

Implementar a view e formulário da etapa 1 (Identificação):
1. Rota `/automations/:automationId/identification` e view `identification-step-view.tsx`.
2. Schema Zod `automationIdentificationSchema` em `automation-step-schemas.ts` (nome opcional no rascunho, até 80 caracteres).
3. Formulário com React Hook Form integrado à barra de salvamento (`automation-save-bar.tsx`).
4. Hook de mutação `use-automation-mutations.ts` (`PATCH /automations/:id` com `{ name }`).
5. Atualização otimista/direta do cache de detalhe e feedback de sucesso ou erro no salvamento.

## Acceptance criteria

- [ ] Campo de nome da automação permite preencher até 80 caracteres e valida comprimento máximo.
- [ ] Botão de salvar dispara `PATCH /automations/:id` e exibe feedback de progresso e sucesso.
- [ ] Botão de salvar/avançar permite seguir para a próxima etapa (`/content`).
- [ ] Rascunho permite salvar campo em branco sem bloquear persistência da revisão atual.
- [ ] Testes no DOM com Vitest Browser cobrindo renderização, digitação, validação de caracteres, salvamento e atualização de cache.
- [ ] A seção `Result` documenta o comportamento entregue, Diagrama Mermaid caso aplicável, os principais arquivos ou contratos, Responsabilidade de cada arquivo, explicações sobre conceitos (caso aplicável e necessário), decisões e limites relevantes e as validações executadas.

## Blocked by

- docs/tickets/automation-configuration-management/003-criacao-de-rascunho-e-layout-do-editor.md
