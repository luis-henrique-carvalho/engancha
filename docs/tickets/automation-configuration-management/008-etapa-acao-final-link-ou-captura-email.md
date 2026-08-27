---
title: "Etapa de ação final (Link ou Captura de E-mail)"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/automation-configuration-management.md"
blocked_by: ["docs/tickets/automation-configuration-management/007-etapas-resposta-publica-e-mensagem-direta.md"]
user_stories: [4]
---

## Parent

PRD `docs/prds/automation-configuration-management.md`; cobre a configuração da ação final exclusiva (`LINK` ou `CAPTURE_EMAIL`).

## What to build

Implementar a etapa 6 (Ação final):
1. Rota `/automations/:automationId/final-action` e view `final-action-step-view.tsx`.
2. Seletor de modo exclusivo entre `LINK` (URL até 2.048 caracteres + rótulo até 80 caracteres) e `CAPTURE_EMAIL` (pergunta/chamada até 300 caracteres).
3. Schemas de validação condicionais com Zod em `automation-step-schemas.ts`.
4. Integração com `automation-action-mappers.ts` para posicionar a ação final na terceira posição da lista enviada ao backend.
5. Salvamento via `PATCH /automations/:id`.

## Acceptance criteria

- [ ] Interface permite alternar de forma clara e acessível entre `LINK` e `CAPTURE_EMAIL`.
- [ ] Quando `LINK` está selecionado, valida campos de URL (formato e limite) e rótulo do botão.
- [ ] Quando `CAPTURE_EMAIL` está selecionado, valida campo de mensagem/pergunta de captura.
- [ ] Salvamento persiste a ação final correspondente mantendo `PUBLIC_REPLY` e `PRIVATE_REPLY` intactas na sequência.
- [ ] Testes no DOM com Vitest Browser cobrindo alternância de tipo de ação, validações específicas de cada formulário e salvamento.
- [ ] A seção `Result` documenta o comportamento entregue, Diagrama Mermaid caso aplicável, os principais arquivos ou contratos, Responsabilidade de cada arquivo, explicações sobre conceitos (caso aplicável e necessário), decisões e limites relevantes e as validações executadas.

## Blocked by

- docs/tickets/automation-configuration-management/007-etapas-resposta-publica-e-mensagem-direta.md
