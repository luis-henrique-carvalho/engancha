---
title: "Comentário idempotente cria execução consultável"
status: "completed"
type: "AFK"
parent: "docs/prds/end-to-end-simulation.md"
blocked_by: []
user_stories: [1, 8, 9]
---

## Parent

PRD `docs/prds/end-to-end-simulation.md`; cobre `FR-SIM-001`, a base de `FR-SIM-007`, `FR-CHANNEL-001` a `FR-CHANNEL-003`, `FR-CHANNEL-009`, `RN-001`, `RN-006` a `RN-009` e as User Stories 1, 8 e 9.

## What to build

Entregar a primeira fatia executável da simulação: reconciliar o modelo lógico necessário, persistir uma interação/execução simulada idempotente no workspace ativo, publicar um job versionado na fila `automation-execution` e permitir consultar a projeção autoritativa da execução. O request aceita provider, conteúdo, autor, texto, identificador opcional do comentário e chave técnica de idempotência; ele rejeita `mode`, que é sempre imposto como `SIMULATED` pela API.

## Acceptance criteria

- [x] O modelo lógico e a migration suportam execução antes do match, input validado, estado inicial `PENDING`, versão de estado e saídas futuras sem criar entidades da Fase 5.
- [x] `POST /api/v1/simulations/comments` aceita somente conteúdo simulado do workspace ativo, provider habilitado e conexão nula; `INSTAGRAM` é a única opção disponível.
- [x] O schema estrito rejeita `mode` enviado pelo browser e a persistência sempre grava `mode=SIMULATED`.
- [x] A mesma chave idempotente no mesmo workspace/provider retorna o mesmo `executionId` e não cria uma segunda execução nem um segundo ciclo lógico de enfileiramento.
- [x] A API publica um job `automation-execution` versionado contendo apenas identificadores e correlação seguros, sem snapshot da automação ou tenant confiado ao browser.
- [x] `GET /api/v1/simulations/executions/:id` retorna a projeção PostgreSQL da execução e aplica sessão, workspace ativo e política `404` para acesso cruzado.
- [x] Testes de contrato, Prisma, API e fila cobrem entrada válida, `mode` proibido, provider/conteúdo inválido, idempotência concorrente, indisponibilidade da fila e isolamento multi-tenant.
- [x] Typecheck, lint, formatter, migration e testes relevantes são executados e registrados em `Result`.

## Blocked by

None - can start immediately. A fundação BullMQ e a Fase 3 já estão concluídas.

## Result

Entregue a fatia de ingestão e consulta autoritativa de simulações:

- Migration `0003_simulated_automation_executions` e Prisma criam `AutomationExecution` e `AutomationExecutionOutput`, com estado `PENDING`, versão de estado, tentativas, campos de match/snapshot futuros, saídas determinísticas e unicidade por workspace/provider/mode/idempotency key.
- `POST /api/v1/simulations/comments` aceita apenas Instagram simulado, valida estritamente conteúdo, autor, texto, identificador opcional do comentário e chave técnica de idempotência. `mode` é rejeitado no contrato e persistido como `SIMULATED`; a conexão permanece nula.
- A primeira submissão cria a execução e publica um job `automation-execution` versionado contendo somente `executionId`, `organizationId` e `correlationId`. Repetições retornam a mesma execução sem novo enfileiramento. Se a fila falhar, a execução pendente é preservada para um reenvio idempotente e a API retorna `503`.
- `GET /api/v1/simulations/executions/:id` retorna a projeção PostgreSQL e aplica `404` para execução inexistente ou de outro workspace.
- Foram incluídos contratos OpenAPI, testes de contrato/serviço e um teste de integração API/Prisma preparado para a suíte padrão.

Validações executadas:

- `npm run db:generate` — passou.
- `npm run db:migrate` — passou; migration `0003_simulated_automation_executions` aplicada no PostgreSQL local.
- `npm run typecheck` — passou.
- `node --import tsx --test tests/automations-contracts-domain.test.mjs tests/simulations-ingestion.test.mjs` — passou.
- `npm run lint` — passou.
- `npm run test:simulations:e2e` — passou (4 testes: persistência/projeção, contrato estrito, recuperação idempotente da indisponibilidade de fila e isolamento multi-tenant).
- `npm run web:test` — passou (30 arquivos e 189 testes).

Revisão posterior: a integração foi conferida contra a documentação oficial do NestJS/BullMQ. A fila permanece registrada por `BullModule.registerQueue`, injetada por `@InjectQueue` e recebe jobs por `Queue.add`. A marcação local de tentativa de fila foi removida porque poderia ficar presa após uma interrupção entre PostgreSQL e Redis; o `jobId` determinístico da execução passa a ser a deduplicação efetiva do BullMQ. A migration `0004_remove_execution_enqueue_lease` foi aplicada e o E2E passou novamente.
- `npm run format:check` — detecta somente arquivos Prisma gerados já fora do formato do Prettier; não foram reformulados por serem artefatos gerados.
