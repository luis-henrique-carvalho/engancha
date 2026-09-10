---
title: "Aba Testar continua jornada com resposta de e-mail"
status: "needs-triage"
type: "AFK"
parent: "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md"
blocked_by:
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/004-email-response-enriches-contact-and-creates-first-lead.md"
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/005-email-capture-handles-conflict-supersession-concurrency-and-retry.md"
user_stories: [3, 4]
---

## Parent

PRD `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md`; torna interativa a experiência do seguidor nas User Stories 3 e 4.

## What to build

Estender a aba `Testar` para continuar a mesma jornada simulada depois da mensagem que solicita e-mail. Exibir o campo apenas para a captura pendente atual, submeter com chave idempotente por meio dos hooks e services da feature e reconciliar a projeção autoritativa até sucesso ou estado que exija ação.

A interface deve distinguir validação, processamento, conclusão, substituição, conflito e falha transitória em linguagem de produto, preservar a timeline existente e manter comportamento acessível e responsivo.

## Acceptance criteria

- [ ] O campo de e-mail aparece somente depois de uma solicitação vinculada à jornada atual e identifica de forma acessível o que será enviado.
- [ ] A submissão usa uma chave idempotente estável e não aceita clique repetido como uma nova resposta lógica.
- [ ] Validação local e resposta autoritativa inválida permitem corrigir o endereço sem acrescentar mensagem ou reiniciar a execução.
- [ ] Estados pendente, enviando/processando, concluído, substituído, conflito e retry são visualmente e semanticamente distintos.
- [ ] Conclusão acrescenta a resposta à jornada e confirma a captura sem afirmar uma nova execução da automação.
- [ ] Desconexão do tempo real ou recarga recupera o estado por HTTP e não perde nem duplica a submissão.
- [ ] Rotas e views não contêm chamadas HTTP, query keys ou mutations; hooks/services da feature concentram integração e cache.
- [ ] Testes browser cobrem teclado, leitores de tela, validação, repetição, reload, conflito, supersession, retry e layouts suportados.
- [ ] Typecheck, lint, formatter e testes web relevantes são executados e registrados em `Result`.

## Blocked by

- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/004-email-response-enriches-contact-and-creates-first-lead.md`
- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/005-email-capture-handles-conflict-supersession-concurrency-and-retry.md`

## Result

Não iniciado.
