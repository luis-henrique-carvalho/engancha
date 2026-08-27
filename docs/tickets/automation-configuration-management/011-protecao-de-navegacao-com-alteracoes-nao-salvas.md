---
title: "Proteção de navegação e conflitos de gatilho"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/automation-configuration-management.md"
blocked_by: ["docs/tickets/automation-configuration-management/010-pausa-e-edicao-de-automacoes-ativas.md"]
user_stories: [1, 4, 6]
---

## Parent

PRD `docs/prds/automation-configuration-management.md`; cobre a proteção contra perda acidental de dados locais e o tratamento de conflitos de gatilho na publicação.

## What to build

Implementar proteção de navegação e tratamento refinado de erros de domínio:
1. Hook `use-unsaved-changes.ts` para detectar alterações pendentes no formulário da etapa atual e interceptar navegação de rota ou fechamento de aba via `ConfirmDialog` / `beforeunload`.
2. Tratamento específico para o erro `AUTOMATION_TRIGGER_CONFLICT` retornado na publicação, indicando que já existe outra automação ativa com a mesma combinação de conteúdo e palavra-chave, com link direto para as etapas de conteúdo e palavra-chave.
3. Revisão geral de acessibilidade, navegação por teclado e ausência de warnings de console na suíte de testes.

## Acceptance criteria

- [ ] Navegar para outra etapa ou rota com alterações não salvas no formulário exibe diálogo de confirmação antes de descartar dados.
- [ ] Erro `AUTOMATION_TRIGGER_CONFLICT` na publicação exibe mensagem clara e atalhos para ajustar conteúdo ou palavra-chave.
- [ ] Acessibilidade de foco, labels e atalhos de teclado validados no editor e listagem.
- [ ] Testes no DOM com Vitest Browser cobrindo interceptação de navegação com formulário dirty e feedback de conflito de gatilho.
- [ ] A seção `Result` documenta o comportamento entregue, Diagrama Mermaid caso aplicável, os principais arquivos ou contratos, Responsabilidade de cada arquivo, explicações sobre conceitos (caso aplicável e necessário), decisões e limites relevantes e as validações executadas.

## Blocked by

- docs/tickets/automation-configuration-management/010-pausa-e-edicao-de-automacoes-ativas.md
