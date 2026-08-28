---
title: "Worker encontra revisão publicada ou ignora comentário"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/end-to-end-simulation.md"
blocked_by: ["docs/tickets/end-to-end-simulation/001-comentario-idempotente-cria-execucao-consultavel.md"]
user_stories: [2, 4, 8]
---

## Parent

PRD `docs/prds/end-to-end-simulation.md`; cobre `FR-SIM-002`, amplia `FR-SIM-007`, aplica `RN-002`, `RN-003`, `RN-005` e atende às User Stories 2, 4 e 8.

## What to build

Fazer o worker consumir e revalidar o job, reivindicar a execução de modo concorrente e encontrar a única automação `ACTIVE` cuja revisão publicada aponta para o conteúdo e cuja palavra/frase inteira normalizada corresponde ao comentário. Persistir um snapshot sanitizado no match; concluir como `IGNORED` sem saídas quando não houver correspondência; falhar fechado, sem executar ações, se houver múltiplos matches.

## Acceptance criteria

- [ ] O processor usa a integração oficial NestJS/BullMQ, revalida o contrato compartilhado e rejeita payload inválido como não recuperável.
- [ ] O claim condicional impede que redelivery ou workers concorrentes processem a mesma execução simultaneamente.
- [ ] A busca considera somente workspace, conteúdo, provider/modo, status `ACTIVE` e revisão publicada atual; a automação de origem da UI não participa da seleção.
- [ ] O matching reutiliza o normalizador compartilhado e a regra de palavra/frase inteira aprovada na Fase 3.
- [ ] Nenhum match produz `IGNORED`, `matched=false`, motivo seguro e nenhuma saída.
- [ ] Um match único vincula automação/revisão e persiste snapshot imutável de alvo, trigger e ações, sem credenciais.
- [ ] Múltiplos matches produzem `FAILED` com código sanitizado de integridade e nunca escolhem ou executam mais de uma automação.
- [ ] Pausa anterior ao claim impede seleção; edição, republicação ou pausa posterior ao snapshot não altera a execução iniciada.
- [ ] Testes unitários, Prisma, worker e E2E cobrem match, no-match, ambiguidade, pausa, snapshot imutável, concorrência e isolamento de falhas.

## Blocked by

- `docs/tickets/end-to-end-simulation/001-comentario-idempotente-cria-execucao-consultavel.md`

## Result

Preencher durante a implementação com comportamento entregue, fluxo de claim/matching, contratos, arquivos principais, decisões e validações executadas.
