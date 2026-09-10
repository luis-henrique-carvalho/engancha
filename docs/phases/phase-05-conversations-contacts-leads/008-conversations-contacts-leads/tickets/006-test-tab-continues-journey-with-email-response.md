---
title: "Aba Testar continua jornada com resposta de e-mail"
status: "closed"
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

- [x] O campo de e-mail aparece somente depois de uma solicitação vinculada à jornada atual e identifica de forma acessível o que será enviado.
- [x] A submissão usa uma chave idempotente estável e não aceita clique repetido como uma nova resposta lógica.
- [x] Validação local e resposta autoritativa inválida permitem corrigir o endereço sem acrescentar mensagem ou reiniciar a execução.
- [x] Estados pendente, enviando/processando, concluído, substituído, conflito e retry são visualmente e semanticamente distintos.
- [x] Conclusão acrescenta a resposta à jornada e confirma a captura sem afirmar uma nova execução da automação.
- [x] Desconexão do tempo real ou recarga recupera o estado por HTTP e não perde nem duplica a submissão.
- [x] Rotas e views não contêm chamadas HTTP, query keys ou mutations; hooks/services da feature concentram integração e cache.
- [x] Testes browser cobrem teclado, leitores de tela, validação, repetição, reload, conflito, supersession, retry e layouts suportados.
- [x] Typecheck, lint, formatter e testes web relevantes são executados e registrados em `Result`.

## Blocked by

- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/004-email-response-enriches-contact-and-creates-first-lead.md`
- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/005-email-capture-handles-conflict-supersession-concurrency-and-retry.md`

## Result

Implementado e verificado:
- `SimulationFollowerChat` (`apps/web`) atualizado com formulário inline de submissão de e-mail para capturas pendentes na jornada.
- Gerenciamento de chave idempotente estável gerada por submissão e propagação via `SimulationsApi` e `useSimulationExecution`.
- Tratamento visual e semântico dos estados: formulário interativo de envio, indicador de processamento/enviando, balão de resposta do seguidor, banner de lead capturado com sucesso, alerta informativo de supersessão (`SUPERSEDED`), alerta destrutivo de conflito de identidade (`IDENTITY_CONFLICT`) permitindo correção sem reinício da execução, e botão de retry para falhas de rede.
- Componentes e hooks isolados respeitando a convenção de não realizar chamadas HTTP nas views/rotas.
- Testes browser em `simulation-follower-chat.test.tsx` e `automation-test-tab-view.test.tsx` cobrindo todos os cenários com 100% de aprovação.
- Verificação global bem-sucedida: `npm run verify` (`npm run typecheck`, `npm test`, `npm run lint`, `npm run format:check`).

