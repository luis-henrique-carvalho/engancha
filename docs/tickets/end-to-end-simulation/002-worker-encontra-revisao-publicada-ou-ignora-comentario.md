---
title: "Worker encontra revisão publicada ou ignora comentário"
status: "completed"
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

- [x] O processor usa a integração oficial NestJS/BullMQ, revalida o contrato compartilhado e rejeita payload inválido como não recuperável.
- [x] O claim condicional impede que redelivery ou workers concorrentes processem a mesma execução simultaneamente.
- [x] A busca considera somente workspace, conteúdo, provider/modo, status `ACTIVE` e revisão publicada atual; a automação de origem da UI não participa da seleção.
- [x] O matching reutiliza o normalizador compartilhado e a regra de palavra/frase inteira aprovada na Fase 3.
- [x] Nenhum match produz `IGNORED`, `matched=false`, motivo seguro e nenhuma saída.
- [x] Um match único vincula automação/revisão e persiste snapshot imutável de alvo, trigger e ações, sem credenciais.
- [x] Múltiplos matches produzem `FAILED` com código sanitizado de integridade e nunca escolhem ou executam mais de uma automação.
- [x] Pausa anterior ao claim impede seleção; edição, republicação ou pausa posterior ao snapshot não altera a execução iniciada.
- [x] Testes unitários, Prisma, worker e E2E cobrem match, no-match, ambiguidade, pausa, snapshot imutável, concorrência e isolamento de falhas.

## Blocked by

- `docs/tickets/end-to-end-simulation/001-comentario-idempotente-cria-execucao-consultavel.md`

## Result

Entregue o pipeline de claim, busca de candidatos, matching determinístico e persistência de snapshot no worker NestJS:

- **Contratos e Domínio (`@engancha/contracts`)**:
  - `automationSnapshotSchema` e tipo `AutomationSnapshot` estrito, contendo exclusivamente identificadores, alvos, gatilhos normalizados e configurações de ações publicadas, sem credenciais ou segredos.
  - `matchesAutomationKeyword` e `normalizeAutomationText` para validação de palavra/frase inteira insensível a maiúsculas, acentos, hífens e pontuação.
- **Worker (`@engancha/worker`)**:
  - Adicionado `DatabaseModule` e `PrismaService` no runtime do worker com conexão via `@prisma/adapter-pg` e configuração de ambiente com `DATABASE_URL`.
  - Definida a porta de repositório `AUTOMATION_EXECUTION_REPOSITORY` e implementado `PrismaAutomationExecutionRepository`.
  - Claim condicional atômico (`updateMany` com `status: PENDING`) que avança a execução para `PROCESSING`, incrementa tentativas e previne concorrência e redelivery duplicados.
  - Consulta estrita de automações candidatas filtrando apenas por `organizationId`, `status: ACTIVE`, revisão publicada atual apontando para o `contentId` e provider/modo correspondentes; `originAutomationId` não participa do matching.
  - `AutomationExecutionService` trata os três desfechos possíveis:
    - **Sem correspondência (0 matches)**: finaliza com `status: IGNORED`, `matched: false`, mensagem segura e nenhuma saída.
    - **Match único (1 match)**: persiste o snapshot sanitizado imutável, vincula `automationId` e `automationRevisionId`, define `matched: true` e mantém a execução em `PROCESSING` para as ações subsequentes.
    - **Múltiplos matches (>1 matches)**: falha fechado com `status: FAILED`, `matched: false`, código `AMBIGUOUS_AUTOMATION_MATCH`, mensagem sanitizada e sem executar automações.
- **Validações executadas**:
  - `npm run typecheck` — passou sem erros em todos os workspaces (`@engancha/api`, `@engancha/contracts`, `@engancha/web`, `@engancha/worker`).
  - `npm run lint` — passou sem erros.
  - `tests/automations-contracts-domain.test.mjs` — 6 testes passando (normalização, matching, snapshot sanitizado).
  - `tests/worker-automation-execution.test.mjs` — 7 testes unitários do processador e consumidor passando.
  - `npm run test:simulations:e2e` — 9 testes de integração/E2E passando (persistência, rejeição estrita, indisponibilidade da fila, isolamento multi-tenant, match único com snapshot imutável, no-match ignorado, ambiguidade com falha fechada, automação pausada e concorrência no claim).
  - `npm test` — suíte completa de testes passou com 100% de sucesso.
