---
title: "Etapa de revisão e publicação"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/automation-configuration-management.md"
blocked_by: ["docs/tickets/automation-configuration-management/008-etapa-acao-final-link-ou-captura-email.md"]
user_stories: [5, 6]
---

## Parent

PRD `docs/prds/automation-configuration-management.md`; cobre a User Story 6 e a consolidação do resumo, checklist de validação e publicação de automação.

## What to build

Implementar a etapa 7 (Revisão) e o fluxo de publicação:
1. Rota `/automations/:automationId/review` e view `review-step-view.tsx` com componente `automation-review.tsx`.
2. Exibição consolidada de todas as etapas configuradas (Nome, Conteúdo, Gatilho, Resposta pública, DM, Ação final).
3. Checklist de prontidão para publicação apontando campos/etapas incompletas com links de atalho para a etapa correspondente.
4. Botão "Publicar automação" disparando `POST /automations/:id/publish`.
5. Tratamento de erro `AUTOMATION_NOT_PUBLISHABLE` destacando os problemas retornados pela API e feedback claro de sucesso mudando o status para `ACTIVE`.

## Acceptance criteria

- [ ] Tela de revisão exibe resumo fiel de todos os dados configurados no rascunho.
- [ ] Checklist indica visualmente itens pendentes e bloqueia o botão de publicar se houver pendências locais.
- [ ] Ao clicar em "Publicar", chama `POST /automations/:id/publish` e atualiza o detalhe e a listagem.
- [ ] Tratamento de erros de validação do backend (`AUTOMATION_NOT_PUBLISHABLE`) exibindo issues por etapa.
- [ ] Testes no DOM com Vitest Browser cobrindo renderização do checklist, resumo completo, tentativa de publicação inválida e publicação com sucesso.
- [ ] A seção `Result` documenta o comportamento entregue, Diagrama Mermaid caso aplicável, os principais arquivos ou contratos, Responsabilidade de cada arquivo, explicações sobre conceitos (caso aplicável e necessário), decisões e limites relevantes e as validações executadas.

## Blocked by

- docs/tickets/automation-configuration-management/008-etapa-acao-final-link-ou-captura-email.md
