---
title: "Observabilidade e logs estruturados do pipeline de simulação"
status: "completed"
type: "AFK"
parent: "docs/prds/end-to-end-simulation.md"
blocked_by:
  - "docs/tickets/end-to-end-simulation/001-comentario-idempotente-cria-execucao-consultavel.md"
  - "docs/tickets/end-to-end-simulation/002-worker-encontra-revisao-publicada-ou-ignora-comentario.md"
user_stories: [8, 9]
---

## Parent

PRD `docs/prds/end-to-end-simulation.md`; cobre os requisitos operacionais e de qualidade de `FR-SIM-001` a `FR-SIM-008`, isolamento de dados sensíveis e as User Stories 8 e 9.

## What to build

Implementar observabilidade e logs estruturados de ponta a ponta para todo o ciclo de vida do fluxo de simulação no servidor (API, fila BullMQ, Worker e stream SSE). O objetivo é permitir que operadores e desenvolvedores acompanhem detalhadamente cada etapa da execução (ingestão, deduplicação/idempotência, enfileiramento, claim pelo worker, matching da automação, captura de snapshot, geração sequencial de saídas, SSE push/reconexão e tratamento de falhas/retries), preservando a correlação de contexto sem vazar dados sensíveis, payloads integrais de comentários ou mensagens do seguidor.

## Acceptance criteria

- [x] Utilizar o padrão `StructuredLogger` (`event` estruturado com chave=valor) em todos os componentes do backend que participam do ciclo de simulação.
- [x] Na API, logar eventos de ingestão: recebimento de requisição, resolução de chave de idempotência (nova execução criada vs execução existente reutilizada), validação de workspace/conteúdo/provider e publicação de job na fila com `executionId`, `correlationId` e `jobId`.
- [x] Na API, logar eventos de controle e recuperação: consultas autoritativas (`GET /executions/:id`), validação de elegibilidade e re-enfileiramento de `retry` para execuções falhas.
- [x] Na API, logar ciclo de vida das conexões SSE: abertura de stream autenticado, emissão de snapshot inicial, envio de eventos em tempo real, heartbeats e encerramento/desconexão de cliente.
- [x] No Worker, logar ciclo de processamento do job: início/claim de execução, número da tentativa (`attempt`), correlação e validação de payload.
- [x] No Worker, logar etapas de matching e snapshot: candidatos avaliados, correspondência única identificada, resultado `IGNORED` quando não houver match e falha por ambiguidade (`FAILED` sem saídas).
- [x] No Worker, logar progressão ordenada das saídas simuladas (resposta pública, DM, entrega de link ou solicitação de captura de e-mail) e transições atômicas de estado no PostgreSQL com incremento de `stateVersion`.
- [x] No Worker e na API, logar detalhadamente erros operacionais e transientes com código de falha sanitizado, diferenciando tentativas em backoff de falhas terminais esgotadas.
- [x] Garantir que logs contenham apenas identificadores correlacionáveis (`organizationId`, `executionId`, `jobId`, `correlationId`, `stateVersion`, `status`, `attempt`), proibindo estritamente o log de texto integral de comentários, mensagens diretas completas, links sensíveis, credenciais ou dados pessoais (PII).
- [x] Testes unitários e de integração validam a emissão dos eventos estruturados esperados e a sanitização de dados no logger.
- [x] A seção `Result` documenta o comportamento entregue, os eventos de log padronizados, responsabilidade de cada ponto instrumentado e as validações executadas.

## Blocked by

- `docs/tickets/end-to-end-simulation/001-comentario-idempotente-cria-execucao-consultavel.md`
- `docs/tickets/end-to-end-simulation/002-worker-encontra-revisao-publicada-ou-ignora-comentario.md`

## Result

Entregue a instrumentação de observabilidade e logs estruturados de ponta a ponta no pipeline do servidor (API e Worker):

- **Eventos estruturados na API (`SimulationsService`)**:
  - Ingestão: `simulation_comment_received`, `simulation_comment_rejected`, `simulation_execution_created`, `simulation_execution_reused`, `simulation_execution_enqueued`, `simulation_execution_enqueue_failed`.
  - Consultas e controle: `simulation_execution_queried`, `simulation_execution_query_not_found`.
  - Reprocessamento: `simulation_execution_retry_requested`, `simulation_execution_retry_accepted`, `simulation_execution_retry_rejected`.
  - Stream SSE: `simulation_stream_opened`, `simulation_stream_snapshot_emitted`, `simulation_stream_heartbeat_emitted`, `simulation_stream_update_emitted`, `simulation_stream_completed`, `simulation_stream_closed`, `simulation_stream_not_found`.
- **Eventos estruturados no Worker (`AutomationExecutionService` e `BullMqAutomationExecutionProcessor`)**:
  - Ciclo de Job/Fila: `automation_execution_job_received`, `automation_execution_job_rejected`, `automation_execution_job_completed`, `automation_execution_job_retry`, `automation_execution_job_failed_definitive`, `automation_execution_job_failure_handler_error`.
  - Claim e Matching: `automation_execution_claimed`, `automation_execution_claim_skipped`, `automation_execution_snapshot_reused`, `automation_execution_matching_started`, `automation_execution_matched`, `automation_execution_ignored`, `automation_execution_ambiguous_match`, `automation_execution_unsupported_action`.
  - Execução e Saídas: `automation_execution_outputs_generated`, `automation_execution_completed`.
  - Resiliência e Falhas: `automation_execution_attempt_recorded`, `automation_execution_failed_terminal`.
- **Invariantes de Segurança e Sanitização**:
  - Todos os eventos utilizam campos de correlação técnicos (`organizationId`, `executionId`, `jobId`, `correlationId`, `stateVersion`, `status`, `attempt`, `provider`, `mode`, `outputsCount`, `candidatesCount`, `errorCode`, `reason`).
  - Proibição estrita de logar conteúdo bruto de comentários, mensagens diretas, URLs sensíveis, credenciais ou dados pessoais (PII).

### Validações executadas:
- `node --import tsx --test tests/simulations-observability.test.mjs` — passou (6 testes cobrindo todo o ciclo de vida e garantindo ausência de PII em logs).
- `node --import tsx --test tests/automations-contracts-domain.test.mjs tests/simulations-ingestion.test.mjs tests/simulation-events-port.test.mjs tests/worker-automation-execution.test.mjs tests/simulations-observability.test.mjs` — passou (35 testes unitários/serviço).
- `npm --workspace @engancha/api run typecheck && npm --workspace @engancha/worker run typecheck` — passou sem erros.
- `npx eslint apps/api apps/worker tests` — passou sem erros.
- `npm run test:simulations:e2e` — passou (18 testes E2E com NestJS, PostgreSQL e BullMQ).
