---
title: "Pausa e edição de automações ativas"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/automation-configuration-management.md"
blocked_by: ["docs/tickets/automation-configuration-management/009-etapa-revisao-e-publicacao.md"]
user_stories: [5, 6]
---

## Parent

PRD `docs/prds/automation-configuration-management.md`; cobre a User Story 5 e 6 (pausa de automações ativas e edição de rascunhos sem afetar a versão publicada).

## What to build

Implementar controle de pausa e ciclo de vida de edições em automações ativas:
1. Ação de pausar na listagem e na tela de revisão (`POST /automations/:id/pause`) com modal de confirmação usando `ConfirmDialog` existente no Engancha.
2. Suporte na UI para automações em estado `ACTIVE` com rascunho em edição (`hasUnpublishedChanges`), com badge e indicação clara no editor de que a versão publicada continua intacta até nova publicação.
3. Tratamento para bloquear edição caso a automação esteja em estado `ARCHIVED` (`AUTOMATION_ARCHIVED`).
4. Atualização imediata do cache de detalhe e listagem após pausa ou republicação.

## Acceptance criteria

- [ ] Automação em estado `ACTIVE` pode ser pausada via diálogo de confirmação (`POST /automations/:id/pause`).
- [ ] Automações `PAUSED` não oferecem ação de pausar novamente.
- [ ] Editar uma automação ativa exibe aviso/badge de `hasUnpublishedChanges` sem alterar a versão ativa até a publicação explícita.
- [ ] Tentativa de editar automação arquivada exibe bloqueio e mensagem informativa.
- [ ] Testes no DOM com Vitest Browser cobrindo confirmação de pausa, atualização de badges e ciclo de edição com rascunho não publicado.
- [ ] A seção `Result` documenta o comportamento entregue, Diagrama Mermaid caso aplicável, os principais arquivos ou contratos, Responsabilidade de cada arquivo, explicações sobre conceitos (caso aplicável e necessário), decisões e limites relevantes e as validações executadas.

## Blocked by

- docs/tickets/automation-configuration-management/009-etapa-revisao-e-publicacao.md
