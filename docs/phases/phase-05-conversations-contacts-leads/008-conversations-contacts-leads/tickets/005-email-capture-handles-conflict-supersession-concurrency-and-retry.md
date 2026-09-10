---
title: "Captura trata conflito, substituição, concorrência e retry"
status: "needs-triage"
type: "AFK"
parent: "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md"
blocked_by:
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/004-email-response-enriches-contact-and-creates-first-lead.md"
user_stories: [3, 7]
---

## Parent

PRD `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md`; endurece a captura conforme as decisões DEC-05 e DEC-06 e as User Stories 3 e 7.

## What to build

Completar a máquina de estados da captura para que uma nova solicitação substitua a anterior ainda pendente, uma única resposta possa reivindicar processamento e todas as corridas convirjam sem efeitos duplicados. Quando identidade do provider e e-mail normalizado apontarem para contatos diferentes, falhar fechado sem mesclar pessoas, mover histórico ou criar lead.

Adicionar classificação segura de falhas e recuperação por retry/backoff para indisponibilidades transitórias, mantendo conflitos de negócio como não retryáveis e protegendo PII em logs, jobs e erros públicos.

## Acceptance criteria

- [ ] Existe no máximo uma captura `PENDING` ou `PROCESSING` por conversa, garantida por transação e restrição de banco apropriada.
- [ ] Uma nova solicitação substitui atomicamente a anterior ainda pendente; a anterior permanece histórica como `SUPERSEDED` e não aceita resposta.
- [ ] A corrida entre resposta e substituição permite que apenas uma operação reivindique a captura e produza efeitos.
- [ ] Repetições com a mesma identidade de submissão retornam o resultado autoritativo sem duplicar mensagem, atualização de contato, lead ou tag.
- [ ] E-mail pertencente a outro contato produz conflito seguro, mantém as identidades separadas e não cria nem reatribui lead ou histórico.
- [ ] Falha transitória permanece recuperável por retry/backoff; falha de negócio não entra em loop de retry.
- [ ] Logs e eventos correlacionam identificadores opacos e resultados sem e-mail completo, conteúdo de mensagem, link ou payload bruto.
- [ ] Testes PostgreSQL e worker exercitam supersession, claim concorrente, conflito de identidade, redelivery, retry e falha depois de etapas intermediárias.
- [ ] Typecheck, lint, formatter e testes relevantes são executados e registrados em `Result`.

## Blocked by

- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/004-email-response-enriches-contact-and-creates-first-lead.md`

## Result

Não iniciado.
