---
title: "Comentário idempotente cria execução consultável"
status: "needs-triage"
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

- [ ] O modelo lógico e a migration suportam execução antes do match, input validado, estado inicial `PENDING`, versão de estado e saídas futuras sem criar entidades da Fase 5.
- [ ] `POST /api/v1/simulations/comments` aceita somente conteúdo simulado do workspace ativo, provider habilitado e conexão nula; `INSTAGRAM` é a única opção disponível.
- [ ] O schema estrito rejeita `mode` enviado pelo browser e a persistência sempre grava `mode=SIMULATED`.
- [ ] A mesma chave idempotente no mesmo workspace/provider retorna o mesmo `executionId` e não cria uma segunda execução nem um segundo ciclo lógico de enfileiramento.
- [ ] A API publica um job `automation-execution` versionado contendo apenas identificadores e correlação seguros, sem snapshot da automação ou tenant confiado ao browser.
- [ ] `GET /api/v1/simulations/executions/:id` retorna a projeção PostgreSQL da execução e aplica sessão, workspace ativo e política `404` para acesso cruzado.
- [ ] Testes de contrato, Prisma, API e fila cobrem entrada válida, `mode` proibido, provider/conteúdo inválido, idempotência concorrente, indisponibilidade da fila e isolamento multi-tenant.
- [ ] Typecheck, lint, formatter, migration e testes relevantes são executados e registrados em `Result`.

## Blocked by

None - can start immediately. A fundação BullMQ e a Fase 3 já estão concluídas.

## Result

Preencher durante a implementação com comportamento entregue, evolução do modelo, contratos, arquivos principais, decisões e validações executadas.
