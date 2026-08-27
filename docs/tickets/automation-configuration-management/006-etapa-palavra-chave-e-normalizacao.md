---
title: "Etapa de palavra-chave e normalização"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/automation-configuration-management.md"
blocked_by: ["docs/tickets/automation-configuration-management/005-etapa-conteudo-simulado-e-criacao-inline.md"]
user_stories: [4]
---

## Parent

PRD `docs/prds/automation-configuration-management.md`; cobre a configuração do gatilho `COMMENT_KEYWORD` e a exibição em tempo real da forma normalizada.

## What to build

Implementar a etapa 3 (Palavra-chave):
1. Rota `/automations/:automationId/keyword` e view `keyword-step-view.tsx`.
2. Formulário com campo de texto para a palavra ou frase de gatilho (limite de 120 caracteres).
3. Componente ou helper visual de prévia da normalização (remoção de acentos, pontuação, caixa baixa e espaços extras) alinhado com o algoritmo compartilhado do backend/contracts.
4. Salvamento da etapa via `PATCH /automations/:id` com `{ trigger: { type: 'COMMENT_KEYWORD', keyword } }`.

## Acceptance criteria

- [ ] Campo de palavra-chave aceita até 120 caracteres e valida limite máximo.
- [ ] Interface exibe em tempo real a prévia da string normalizada correspondente ao que foi digitado.
- [ ] Salvamento da etapa envia o gatilho `COMMENT_KEYWORD` com a palavra original e atualiza o detalhe.
- [ ] Testes no DOM com Vitest Browser cobrindo preenchimento, cálculo visual da normalização e salvamento da etapa.
- [ ] A seção `Result` documenta o comportamento entregue, Diagrama Mermaid caso aplicável, os principais arquivos ou contratos, Responsabilidade de cada arquivo, explicações sobre conceitos (caso aplicável e necessário), decisões e limites relevantes e as validações executadas.

## Blocked by

- docs/tickets/automation-configuration-management/005-etapa-conteudo-simulado-e-criacao-inline.md
