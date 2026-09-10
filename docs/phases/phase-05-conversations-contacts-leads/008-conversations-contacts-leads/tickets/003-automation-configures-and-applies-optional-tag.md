---
title: "Automação configura e aplica tag opcional"
status: "completed"
type: "AFK"
parent: "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md"
blocked_by:
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/001-comment-creates-contact-conversation-inbound-message.md"
user_stories: [5]
---

## Parent

PRD `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md`; entrega a segmentação simples da User Story 5 e da decisão DEC-02.

## What to build

Permitir que uma automação configure zero ou uma tag do workspace, selecionando uma existente ou criando-a inline por nome. A revisão publicada deve capturar a ação `APPLY_TAG`, exibi-la na revisão da automação e aplicá-la idempotentemente ao contato quando uma execução correspondente alcançar a ação.

A fatia cobre persistência de `Tag` e `ContactTag`, contratos, edição/revisão no frontend e execução no worker. A gestão independente, remoção e múltiplas tags permanecem fora do escopo.

## Acceptance criteria

- [x] `Tag` possui nome normalizado único por workspace, e `ContactTag` impede associação duplicada entre contato e tag.
- [x] O editor permite deixar a tag vazia, selecionar uma tag do workspace ou criar uma única tag inline com validação acessível.
- [x] Identificadores de tag de outro workspace são rejeitados sem revelar a existência do recurso.
- [x] A revisão da automação e o snapshot publicado preservam zero ou uma ação `APPLY_TAG` na ordem definida.
- [x] Uma execução correspondente aplica a tag ao contato uma vez, inclusive antes de existir e-mail ou lead, e registra a origem para rastreabilidade.
- [x] Retry, redelivery, repetição da execução ou conversão posterior do contato não duplicam a associação.
- [x] Testes de contrato, domínio, API, worker e web cobrem normalização, criação/seleção, publicação, aplicação, duplicidade e isolamento multi-tenant.
- [x] Typecheck, lint, formatter, migration e testes relevantes são executados e registrados em `Result`.

## Blocked by

- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/001-comment-creates-contact-conversation-inbound-message.md`

## Result

- **Modelagem & Banco de Dados**:
  - Modelos `Tag` e `ContactTag` criados em `prisma/schema.prisma` e migration `0006_execution_history_captures_tags`.
  - Restrição única `[organizationId, normalizedName]` em `Tag` e chave composta primária `[contactId, tagId]` em `ContactTag`.
  - `ContactTag` rastreia origem da atribuição via `originExecutionId` e `originAutomationId`.
- **Contratos & API**:
  - Normalização de nome via `normalizeTagName` (minúsculas, sem acentos, sem `#`, substituição de espaços por `-`).
  - Endpoints `GET /automations/tags` e `POST /automations/tags` expostos no backend com isolamento multi-tenant.
  - Validação estrita no patch de automação: rejeita identificadores de tags pertencentes a outros workspaces com `NotFoundException` (404), sem revelar existência. Suporte a resolução/criação inline por `name`.
- **Frontend (`apps/web`)**:
  - `FinalActionTagField` implementado na etapa de ação final do editor, permitindo selecionar tag existente ou criar nova tag inline com preview normalizado.
  - `orderAutomationActions` e `buildUpdatedActions` ordenam `APPLY_TAG` antes da ação terminal.
  - `AutomationReviewSummary` exibe card dedicado da tag associada ou status de não configurada.
- **Worker (`apps/worker`)**:
  - Mapeamento da ação `APPLY_TAG` para saída `TAG_APPLICATION`.
  - Aplicação idempotente da tag ao contato via `ContactTag` na conclusão da execução, inclusive antes da existência de lead/e-mail, com isolamento multi-tenant.
- **Testes & Qualidade**:
  - Cobertura completa em `tests/contacts-conversations-execution.test.mjs`, `tests/automations-contracts-domain.test.mjs`, `apps/api/src/modules/automations/automations.e2e-spec.js` e suite web vitest.
  - `npm run verify` executado com 100% de sucesso.
