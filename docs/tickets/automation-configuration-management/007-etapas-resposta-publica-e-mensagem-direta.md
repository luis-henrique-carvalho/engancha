---
title: "Etapas de resposta pública e mensagem direta"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/automation-configuration-management.md"
blocked_by: ["docs/tickets/automation-configuration-management/006-etapa-palavra-chave-e-normalizacao.md"]
user_stories: [4]
---

## Parent

PRD `docs/prds/automation-configuration-management.md`; cobre a configuração das ações obrigatórias `PUBLIC_REPLY` e `PRIVATE_REPLY` com garantia da ordem determinística.

## What to build

Implementar as etapas 4 (Resposta pública) e 5 (Mensagem direta):
1. Rota `/automations/:automationId/public-reply` e view `public-reply-step-view.tsx` para edição do texto da ação `PUBLIC_REPLY` (até 1.000 caracteres).
2. Rota `/automations/:automationId/direct-message` e view `direct-message-step-view.tsx` para edição do texto da ação `PRIVATE_REPLY` (até 1.000 caracteres).
3. Mapeador de ações `automation-action-mappers.ts` para garantir que ao salvar qualquer ação individualmente, a sequência total enviada ao backend mantenha sempre a ordem determinística: `[PUBLIC_REPLY, PRIVATE_REPLY, <FINAL_ACTION>]`.
4. Salvamento de cada etapa via `PATCH /automations/:id` com `{ actions: [...] }`.

## Acceptance criteria

- [ ] Formulário de resposta pública permite editar mensagem de até 1.000 caracteres com contador e validação.
- [ ] Formulário de mensagem direta permite editar mensagem de até 1.000 caracteres com contador e validação.
- [ ] Salvamento de cada etapa preserva as ações já configuradas nas outras etapas, garantindo a ordem canônica no payload.
- [ ] Testes no DOM com Vitest Browser cobrindo edição, limites de texto, salvamento isolado de cada etapa e integridade da sequência de ações.
- [ ] A seção `Result` documenta o comportamento entregue, Diagrama Mermaid caso aplicável, os principais arquivos ou contratos, Responsabilidade de cada arquivo, explicações sobre conceitos (caso aplicável e necessário), decisões e limites relevantes e as validações executadas.

## Blocked by

- docs/tickets/automation-configuration-management/006-etapa-palavra-chave-e-normalizacao.md
