# Fase 4 — Simulação ponta a ponta

## Source and Traceability

Esta PRD cobre o `EPIC-04 — Simulação do fluxo Instagram-first` e a Fase 4 do roadmap. Ela detalha `FR-SIM-001` a `FR-SIM-008`, complementa `FR-CHANNEL-001` a `FR-CHANNEL-005` e `FR-CHANNEL-009`, e aplica `RN-001` a `RN-009` onde pertinentes.

As fontes são `docs/ROADMAP.md`, `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/DATA-MODEL.md`, a PRD `automation-configuration-management.md`, a PRD `channel-connections-automation-targeting.md` e as decisões aprovadas pelo usuário em 27/08/2026. A fundação de filas da PRD `local-executable-monorepo-foundation.md` e o fluxo de autorização da PRD `authentication-workspaces-organization-isolation.md` são dependências já existentes.

As decisões `DEC-01` a `DEC-11` vieram diretamente do escopo aprovado. `DEC-12` a `DEC-18` registram padrões derivados das invariantes existentes e necessários para tornar a implementação inequívoca sem ampliar o escopo do produto.

## Problem Statement

O usuário já consegue configurar e publicar uma automação para um conteúdo simulado, mas ainda não consegue comprovar como ela responderia a um comentário realista. Também não existe uma execução persistida que atravesse API, Redis/BullMQ, worker e PostgreSQL, preserve a revisão publicada usada e apresente o resultado em linguagem de produto.

Sem esta fase, o formulário de automações termina na configuração: o usuário não vê a experiência do seguidor, o motor assíncrono ainda não aplica as regras publicadas e a futura integração Meta não possui um pipeline normalizado e idempotente para reutilizar.

## Goal and Scope

O objetivo é permitir que um membro confirmado simule um comentário associado a um conteúdo, receba imediatamente um identificador de execução e acompanhe até um resultado persistido e compreensível. O percurso obrigatório é:

```text
browser → API → PostgreSQL/BullMQ → worker → PostgreSQL → API/SSE → browser
```

Incluído:

- seletor de provider no simulador, inicialmente com `Instagram` como única opção disponível;
- ingestão de comentário normalizado com `mode=SIMULATED` imposto pela API;
- associação do comentário a um conteúdo simulado do workspace ativo;
- descoberta, no worker, da única automação ativa cujo alvo e palavra-chave correspondem;
- execução baseada em snapshot imutável da revisão publicada encontrada;
- persistência do comentário de entrada, da execução e das saídas simuladas;
- resposta pública, DM, entrega de link e solicitação de captura de e-mail;
- estados `PENDING`, `PROCESSING`, `COMPLETED`, `IGNORED` e `FAILED`;
- retry/backoff automático e reprocessamento manual exclusivo de falhas;
- consulta HTTP da execução, histórico de atividade e atualização em tempo real por SSE;
- áreas `Configuração`, `Testar` e `Atividade` no detalhe da automação;
- identificação visual e contratual inequívoca de que os dados são simulados.

Não incluído:

- conexão externa, OAuth, webhooks ou qualquer chamada/publicação real em provider;
- conversas, contatos, leads, tags ou captura efetiva de e-mail;
- persistência em `Conversation`, `Message`, `Contact`, `Lead`, `Tag` ou `ContactTag`;
- coleta de uma resposta do seguidor depois da solicitação de e-mail;
- múltiplos providers habilitados além de Instagram;
- seleção manual da automação a executar;
- múltiplas automações executadas para o mesmo comentário;
- monitoramento técnico de jobs, filas ou Redis na interface de produto;
- métricas do dashboard, Bull Board ou operação administrativa ampla.

O critério de sucesso é um comentário simulado correspondente percorrer API → Redis/BullMQ → worker → PostgreSQL e produzir uma jornada observável com resposta pública, DM e ação final. Um comentário sem correspondência deve terminar como ignorado, e uma falha definitiva deve ser recuperável sem duplicar saídas.

## Actors and Permissions

- Membro confirmado do workspace: usa `Testar`, consulta `Atividade`, acompanha execuções e solicita reprocessamento de uma execução falha do workspace ativo.
- Workspace/Organization: é a fronteira de autorização de conteúdo, automação, execução e saída. O backend deriva o contexto da sessão e do membership.
- API: valida a entrada, impõe o modo simulado, persiste a identidade idempotente da interação e enfileira o processamento.
- Worker: encontra a automação ativa compatível, captura a revisão publicada, avalia o gatilho, persiste saídas e atualiza o estado.
- Provider simulado: adapter sem credenciais ou tráfego externo, responsável por produzir e apresentar contratos normalizados compatíveis com as capacidades declaradas.

Owner, admin e member confirmados mantêm a mesma permissão de automações adotada no MVP da Fase 3. RBAC específico para reprocessamento pode evoluir depois. Sessão ausente, e-mail não confirmado, workspace ativo ausente ou membership inválido impedem todas as operações desta PRD.

Uma execução, seu stream SSE e suas saídas só podem ser consultados no workspace ativo. IDs enviados pelo browser nunca constituem autorização, e acesso cruzado segue a política de `404 Not Found` já adotada pelo produto.

## User Stories

1. As a confirmed workspace member, I want to submit a simulated comment for a content item, so that I can validate the automation without connecting an external account.
2. As a confirmed workspace member, I want the system to find the active automation from content and keyword, so that I test the same routing expected from a real interaction.
3. As a confirmed workspace member, I want to see the public reply, DM and final action as the follower would experience them, so that I can assess the automation before using a real provider.
4. As a confirmed workspace member, I want a comment without a keyword match to have a clear ignored result, so that absence of a response is understandable rather than mistaken for a failure.
5. As a confirmed workspace member, I want activity to update in real time and recover after a connection interruption, so that I do not need to refresh or lose the result.
6. As a confirmed workspace member, I want to review recent interactions in understandable groups, so that I can distinguish completed, ignored, processing and failed outcomes.
7. As a confirmed workspace member, I want to retry only failed executions, so that transient technical problems can be recovered without repeating follower-facing outputs.
8. As an operator, I want every execution to preserve its published revision and idempotency identity, so that retries and future edits cannot change historical behavior.
9. As a future provider-adapter developer, I want simulation to use normalized contracts and the production queue path, so that a real provider can reuse the engine instead of creating a parallel flow.

## Functional Behavior

### Areas of the automation detail

1. `Configuração` preserves the existing automation editor and its published/draft lifecycle.
2. `Testar` presents the follower journey. It is available only when the automation has an active published revision; draft or paused automations show a clear explanation and a path back to configuration/publication.
3. `Atividade` presents persisted interactions related to the automation, including simulations initiated from its detail that ended without a match. It does not expose infrastructure vocabulary.
4. The published target content is shown in `Testar` and supplies the `contentId`; it is not an automation selector. Changing the target remains a configuration action and requires publication under the Fase 3 lifecycle.

### Submitting a simulated comment

1. The form displays the simulated content, a provider selector, author identification, optional comment identifier and required comment text.
2. `Instagram` is the only enabled provider. The contract remains extensible to providers the backend later declares simulatable.
3. The browser does not send `mode`. A strict request containing `mode` is rejected; accepted requests always receive `mode=SIMULATED` from the backend.
4. The API verifies session, workspace, content ownership, `Content.mode=SIMULATED`, null connection, provider coherence and provider capabilities before creating work.
5. The request contains a technical idempotency key generated once per submission by the client. The optional comment identifier remains follower/provider metadata and is not the sole deduplication mechanism.
6. The API normalizes the interaction, persists one execution in `PENDING` and enqueues one `automation-execution` job. It returns `executionId`, current status and a simulation marker without waiting for processing.
7. Repeating the same request with the same workspace/provider/idempotency key returns the existing `executionId` and does not enqueue a second logical execution. A new deliberate submission uses a new key.
8. The automation detail may be recorded as the UI origin for activity grouping, but the worker must ignore that reference when selecting what to execute.

### Claim, matching and snapshot

1. The worker revalidates the versioned job payload and atomically claims the execution. A claimed or terminal execution is not executed concurrently a second time.
2. The worker queries only `ACTIVE` automations in the execution workspace whose current published revision targets the submitted content and whose provider/mode are compatible.
3. Matching reuses the shared normalization defined by the Fase 3 PRD: case-insensitive, accent-insensitive, hyphen/extra-space normalized, with whole-word or whole-phrase correspondence.
4. An exact unique match assigns the automation and published revision to the execution, persists an immutable sanitized snapshot and moves processing forward.
5. No match produces `IGNORED`, `matched=false`, a user-safe reason and no output records.
6. More than one compatible match is treated as a configuration-integrity failure. The worker fails closed, persists `FAILED` with a sanitized ambiguity code and produces no outputs; it never chooses arbitrarily or executes multiple automations.
7. Once the execution is claimed with a revision snapshot, later editing, republishing or pausing the automation does not alter that execution. A pause before claim prevents the automation from being selected.

### Producing simulated outputs

1. The worker validates the selected provider capabilities against the snapshot before running actions.
2. Actions execute in their published order and create deterministic output identities derived from the execution and action position/type.
3. A matching flow persists a simulated public reply and a simulated DM.
4. If the final action is `LINK`, the execution also persists the label and URL needed to show that the link was delivered. No network delivery occurs.
5. If the final action is `CAPTURE_EMAIL`, the execution persists only that the follower was asked for an e-mail address, including the configured prompt. It does not accept an e-mail, create a contact or create a lead.
6. Each committed output increments the persisted execution state version, allowing HTTP and SSE projections to show ordered progress.
7. Completion changes the execution to `COMPLETED`, records timestamps and preserves all committed output records.
8. All user-facing projections identify the execution and outputs as simulated and avoid language that implies Instagram actually received or sent anything.

### Failure, automatic retry and manual reprocessing

1. Invalid job payloads are unrecoverable transport failures and do not enter a retry loop.
2. Transient technical failures use explicit BullMQ attempts and exponential backoff. The execution records attempt metadata while remaining nonterminal until attempts are exhausted.
3. Exhausting automatic attempts changes the execution to `FAILED` with a stable error code and sanitized user-facing message. Internal details remain in structured logs, not in product responses.
4. Manual reprocessing is accepted only for `FAILED`. Requests for `PENDING`, `PROCESSING`, `COMPLETED` or `IGNORED` are rejected as an invalid state transition.
5. Manual reprocessing keeps the same `executionId`, input identity, matched revision snapshot when already selected and output idempotency keys. It creates a new processing cycle rather than a second logical execution.
6. Existing committed outputs are upserted or recognized as complete; they are never duplicated. A duplicate POST does not implicitly retry a failed execution.
7. A failed job does not stop the worker or block unrelated executions.

### Loading, SSE and reconnection

1. `GET /simulations/executions/:id` returns the current PostgreSQL projection: input summary, simulation marker, status, match result, automation/revision summary when present, ordered outputs, attempt metadata, safe error and state version.
2. The SSE endpoint authenticates the same workspace context, emits an initial snapshot and then emits user-safe execution updates in increasing state-version order.
3. The stream may include heartbeat frames for connection health, but heartbeat is not product activity and is not persisted as an interaction.
4. When an execution reaches `COMPLETED`, `IGNORED` or `FAILED`, the stream emits the terminal snapshot and may close normally.
5. On page load, refresh or stream interruption, the client first reloads the execution with the HTTP endpoint. If it remains nonterminal, the client reconnects to SSE.
6. Redis or any notification mechanism may accelerate delivery but never supplies the returned state. Every SSE payload is built from or reconciled with PostgreSQL.
7. Temporary SSE loss does not alter processing or execution state. The UI communicates reconnection without presenting the execution itself as failed.

### Testar experience

1. Before submission, the user sees the selected provider, simulated-content context and a compact comment composer.
2. After submission, the page progressively presents `Comentário`, `Resposta pública`, `Mensagem direta` and `Ação final` as a follower journey.
3. Loading language uses product terms such as “Analisando comentário” and “Preparando resposta”. It never mentions job, worker, Redis, queue or retry counters.
4. `IGNORED` explains that no active automation recognized the configured keyword for that content.
5. `FAILED` explains that the simulation could not be completed and offers retry only when permitted.
6. Link and capture-email endings are visibly different. Capture-email stops at the request prompt and explicitly notes that actual data capture belongs to a later phase.
7. Empty, loading, reconnecting, ignored, failed and completed states are keyboard accessible, responsive and announced appropriately to assistive technology.

### Atividade experience

1. Activity loads from persisted executions, ordered newest first and paginated by a stable cursor.
2. Entries are grouped by meaningful time buckets and automation context, with comment author/text summary, content, simulation marker, status and resulting follower-facing actions.
3. An execution originated in the current detail but without a match remains visible as “Sem correspondência”. If another active automation was matched for the same content, the result identifies the matched automation without implying manual selection.
4. Expanded details show the ordered interaction journey and safe failure reason, not raw payloads, stack traces, job IDs or infrastructure events.
5. SSE updates an entry already visible and may prepend a newly created execution; HTTP reload remains authoritative after reconnection.
6. Manual retry is available only on failed entries and preserves the same activity item while its status returns to processing.
7. Empty state explains that activity will appear after the first test. Error and reconnection states preserve already loaded data when possible.

## Domain Rules and Data

The Fase 4 persistence boundary is deliberately smaller than the Fase 5 conversation model:

```text
AutomationExecution
├── workspace and simulated input identity
├── content and provider/mode
├── UI origin automation? (never used for matching)
├── matched automation/revision? (null when ignored)
├── immutable automation snapshot? (present after a match)
├── status, matched, attempts and stateVersion
└── AutomationExecutionOutput[]
    ├── deterministic output key
    ├── action position and normalized type
    ├── validated follower-facing payload
    └── timestamps/status
```

- `AutomationExecution` belongs to one Organization and one simulated content item.
- `provider` and `mode` are independent. Every execution created by this API uses `mode=SIMULATED` and `channelConnectionId=null`.
- The matched `automationId` and revision reference are nullable until matching and remain null for `IGNORED`.
- The optional UI-origin automation reference exists only to preserve the `Testar`/`Atividade` context; matching never reads it.
- The immutable snapshot contains published revision number, target identity, normalized trigger and ordered action configurations actually used. It contains no credential, token or provider-secret field.
- Input data is preserved as a validated snapshot sufficient to show author, comment, content and submission time. Raw provider payloads are not introduced in this phase.
- Outputs are execution-owned records, not `Message` records. They use normalized types such as public reply, private/direct message, link delivery and e-mail-capture request.
- `Conversation`, `Message`, `Contact`, `Lead`, `Tag` and actual e-mail data remain absent. Fase 5 may project or associate execution outputs without rewriting historical execution records.
- Unique execution identity is enforced for the workspace, provider, simulated mode and idempotency key. The optional comment identifier may add traceability but cannot weaken this constraint.
- Output uniqueness is enforced for execution and deterministic action/output key.
- Terminal execution data and outputs are immutable except for an explicit retry of `FAILED`, which may update attempt/status metadata and fill or reconcile the same output identities.
- No physical deletion of executions or outputs is part of this phase. Retention follows the approved product-data policy until a later archival decision.
- Input text and output payloads use the limits already approved by the Fase 3 contracts; author and comment-input limits must be explicit in shared schemas and conservative enough for safe display.

State transitions:

```text
PENDING → PROCESSING → COMPLETED
                     ├→ IGNORED
                     └→ FAILED

FAILED → PENDING → PROCESSING → COMPLETED | FAILED
```

`IGNORED` is a valid business outcome, not a technical failure. Automatic attempts occur inside the processing cycle; only exhausted failure becomes terminal `FAILED`.

## Contracts and Integrations

Protected REST/SSE contracts under `/api/v1`:

- `POST /simulations/comments`: validates and persists a simulated interaction, imposes `mode=SIMULATED`, enqueues processing and returns the execution identity.
- `GET /simulations/executions/:id`: returns the authoritative execution projection.
- `GET /simulations/executions/:id/events`: streams authoritative execution updates by SSE.
- `POST /simulations/executions/:id/retry`: reprocesses only a failed execution while preserving its logical identity.
- `GET /simulations/executions`: lists persisted activity with workspace scope, automation/UI-origin filter and cursor pagination.

Shared contracts define:

- normalized incoming interaction and message shapes;
- public reply, private/direct message and final-action output shapes;
- provider and execution-mode catalogs as separate dimensions;
- `ChannelCapabilities` needed by publication/execution;
- versioned `interaction.received.v1` event;
- versioned `automation-execution` job containing identifiers and correlation data, not an automation snapshot or browser-trusted tenant/mode;
- REST requests/responses and user-safe SSE event envelopes.

The API owns authorization, idempotent ingestion, initial persistence, queue production, HTTP projections and SSE. The worker owns queue consumption, payload revalidation, claim, matching, snapshot selection, action processing and state/output persistence. Both use their own PostgreSQL and Redis adapters and communicate only through contracts and infrastructure, never through runtime imports.

The simulated Instagram input/output adapter implements the normalized ports without OAuth, credentials, webhooks or network calls. Provider-specific payloads do not enter jobs, snapshots or the engine.

## Acceptance Criteria

### Ingestion and authorization

- [x] A confirmed member submits author, comment text, optional comment identifier, provider and content from the active workspace and receives an `executionId` without waiting for the worker.
- [x] Instagram is the only enabled provider, the browser sends no mode, and every accepted execution persists `mode=SIMULATED` with no connection.
- [x] Invalid provider/content combinations, foreign-workspace data and client-supplied mode are rejected before enqueueing.
- [x] Repeating the same idempotency key returns the same execution and creates neither a second job cycle nor duplicate outputs.

### Matching and snapshot

- [x] The worker selects only an active automation with a published revision whose target content, provider/mode and whole-word/phrase keyword match the comment.
- [x] The UI-origin automation is never used as a matching shortcut.
- [x] No match ends in `IGNORED` with no outputs; more than one match fails closed without executing multiple automations.
- [x] A unique match persists an immutable sanitized snapshot of the exact published revision before producing outputs.
- [x] Editing, republishing or pausing after claim does not change the execution snapshot or result.

### Outputs and scope boundary

- [x] A matching link flow persists and displays comment, public reply, DM and link delivery in published order.
- [x] A matching capture-email flow persists and displays only the e-mail request, without collecting an address or creating conversation, contact, lead or tag records.
- [x] Every execution and output is visibly identified as simulated and no external provider call occurs.
- [x] Output identities prevent duplication during worker redelivery, automatic retry and manual reprocessing.

### Status, recovery and real time

- [x] PostgreSQL records the required execution states, attempts, safe failure details, timestamps and monotonic state version.
- [x] Transient failures use retry/backoff; exhausted failures become `FAILED` without stopping unrelated jobs.
- [x] Manual retry is accepted only for `FAILED`, keeps the same execution identity and does not duplicate previously committed outputs.
- [x] HTTP returns the full current execution projection and remains sufficient to load or recover the UI without SSE history.
- [x] SSE emits authenticated workspace-scoped snapshots and updates, reaches the terminal state, and reconnects through HTTP reconciliation.
- [x] Losing the SSE connection does not change processing state or present a false execution failure.

### Product experience

- [x] Automation detail exposes `Configuração`, `Testar` and `Atividade` with accessible navigation and responsive states.
- [x] `Testar` shows the follower journey rather than technical logs and distinguishes link delivery, e-mail request, ignored and failed outcomes.
- [x] Draft or paused automations cannot initiate a test and explain how to become testable.
- [x] `Atividade` lists and groups persisted interactions, keeps ignored simulations understandable and updates visible entries in real time.
- [x] No customer-facing surface exposes job, worker, Redis, queue, stack trace or raw payload terminology.

### Quality and isolation

- [x] Contracts, API, persistence, queue, worker and web tests cover success, ignored, ambiguity, failure, retry, idempotency, reconnection and cross-workspace access.
- [x] Structured logs correlate request, workspace, execution and transport identifiers without logging full comments, DMs, links, e-mails, credentials or secrets.
- [x] Rate limits and SSE connection limits protect simulation endpoints without breaking deterministic retry/reconnection behavior.

## Implementation Decisions

- Add a `Simulation` context to the modular monolith for ingestion, execution queries, activity projections and SSE. It may consult `Automations` and provider-capability ports but does not duplicate automation rules.
- Keep API and worker as separate deployables. The API creates/enqueues; the worker matches/processes; PostgreSQL coordinates durable state.
- Evolve the logical execution model additively with an input snapshot, nullable matched automation/revision, monotonic state version and execution-owned output records. Do not introduce Fase 5 conversation/contact entities early.
- Treat execution claim, match assignment and revision snapshot as transactional. Persist output identities and state transitions with optimistic or conditional writes so stale/repeated workers cannot overwrite a terminal state.
- Use the central queue registry and official NestJS/BullMQ integration. Producers and consumers revalidate shared versioned schemas; invalid jobs are unrecoverable.
- Use deterministic execution/output identities at the database boundary in addition to BullMQ job deduplication. Queue retention or redelivery must not be the only idempotency guard.
- Keep the notification mechanism behind a port. Redis Pub/Sub, PostgreSQL notification or controlled polling may signal change, but SSE always reads/reconciles PostgreSQL before emitting product state.
- Use cookie/session authentication for SSE under the first-party origin. Authorize the execution before opening the stream and avoid tenant or resource identifiers as authorization evidence.
- Keep user-safe status mapping separate from operational logging. Internal failure codes can guide support; public projections remain stable and sanitized.
- The web feature follows the project convention `views`, `components`, `hooks`, `services` and `data`. Routes compose views; HTTP, SSE lifecycle, query keys and invalidation remain outside visual components.
- Preserve the existing automation configuration experience. `Testar` and `Atividade` are detail surfaces over the published revision and persisted executions, not new configuration steps.

## Testing Decisions

- Unit tests cover normalization/matching, candidate filtering, capability validation, state transitions, snapshot immutability, deterministic identities, retry eligibility and public-status mapping.
- Contract tests cover strict request schemas, rejection of `mode`, event/job versions, normalized interactions/outputs, SSE envelopes and safe serialized errors.
- PostgreSQL integration tests cover idempotent ingestion, conditional claim, nullable match for ignored executions, immutable snapshot, output uniqueness, concurrent workers, retry cycles and cross-workspace constraints.
- Redis/BullMQ integration tests cover API production, worker consumption, payload revalidation, transient retry/backoff, unrecoverable payloads, redelivery and worker survival after failure.
- API E2E tests cover submit → GET for completed, ignored and failed outcomes; duplicate submit; retry-state rules; activity pagination; SSE initial/updated/terminal events; reconnection reconciliation; and tenant isolation.
- Web tests cover provider state, comment composer, follower journey, empty/loading/reconnecting/ignored/failed/completed states, retry, activity grouping, accessibility and the absence of technical vocabulary.
- A full local E2E test proves browser/API → BullMQ → worker → PostgreSQL → HTTP/SSE with no Instagram/Meta network dependency.
- Typecheck, lint, formatter, migrations, relevant workspace tests and project review are gates for every vertical slice.

## Out of Scope

- Meta OAuth, account connection, tokens, webhook signatures, real comments, real replies or real DMs.
- `ChannelConnection` creation or the real-provider portions of the channel-targeting PRD.
- Conversation/message history as a messaging domain, contacts, leads, tags and actual e-mail capture.
- Dashboard metrics or analytics jobs derived from executions.
- Multiple simultaneously enabled providers, multiple matches, priority rules or executing more than one automation.
- Generic workflow builder, branching actions, delayed actions or AI-generated content.
- Customer-facing queue administration, job detail or operational retry tooling.
- Long-term archival, payload-retention redesign or replay of arbitrary historical provider events.

## Decision Log

| ID | Decision | Status | Impact | Date |
| --- | --- | --- | --- | --- | --- |
| DEC-01 | O comentário simulado percorre API → Redis/BullMQ → worker → PostgreSQL e retorna um resultado observável. | RESOLVIDA | Valida o pipeline que providers reais reutilizarão. | 2026-08-27 |
| DEC-02 | O usuário escolhe o provider; inicialmente apenas Instagram está disponível. | RESOLVIDA | Prepara extensão sem fingir suporte atual a outros providers. | 2026-08-27 |
| DEC-03 | O browser não envia `mode`; o backend sempre impõe `SIMULATED`. | RESOLVIDA | Impede que entrada do cliente represente uma execução como real. | 2026-08-27 |
| DEC-04 | O comentário pertence a um conteúdo e o worker encontra a automação por alvo e palavra-chave, sem escolha manual. | RESOLVIDA | Mantém o mesmo roteamento esperado de webhooks futuros. | 2026-08-27 |
| DEC-05 | O detalhe da automação possui `Configuração`, `Testar` e `Atividade`; Testar mostra a experiência do seguidor e Atividade usa linguagem de produto. | RESOLVIDA | Separa configuração, experimentação e histórico sem expor infraestrutura. | 2026-08-27 |
| DEC-06 | SSE fornece atualização em tempo real; GET carrega e recupera após reconexão; PostgreSQL é a fonte de verdade. | RESOLVIDA | Tolera perda de conexão ou notificação sem perder estado. | 2026-08-27 |
| DEC-07 | A Fase 4 persiste execução e saídas simuladas, mas não conversa, contato, lead, tag ou e-mail capturado. | RESOLVIDA | Entrega observabilidade sem antecipar o domínio da Fase 5. | 2026-08-27 |
| DEC-08 | Apenas automações publicadas e ativas processam comentários, e a execução preserva snapshot imutável da revisão usada. | RESOLVIDA | Evita que edições futuras mudem resultados históricos. | 2026-08-27 |
| DEC-09 | Idempotência impede saídas duplicadas; falhas usam retry/backoff e reprocessamento manual somente quando `FAILED`, preservando identidade. | RESOLVIDA | Torna reentrega e recuperação seguras. | 2026-08-27 |
| DEC-10 | Sem match resulta em `IGNORED`; falha definitiva resulta em `FAILED`. | RESOLVIDA | Distingue ausência de regra aplicável de problema técnico. | 2026-08-27 |
| DEC-11 | Dados simulados são identificados como simulação e não usam conexão, OAuth ou publicação externa. | RESOLVIDA | Evita interpretação enganosa e mantém o MVP offline do provider. | 2026-08-27 |
| DEC-12 | Matching reutiliza a normalização e a regra de palavra/frase inteira aprovadas na Fase 3. | ACEITA COMO PADRÃO | Garante consistência entre configuração e execução. | 2026-08-27 |
| DEC-13 | A execução persiste entrada e saídas próprias; entidades de conversa/mensagem permanecem para a Fase 5. | ACEITA COMO PADRÃO | Resolve a persistência observável sem romper o limite de escopo aprovado. | 2026-08-27 |
| DEC-14 | Automação/revisão correspondente são nulas até o match e permanecem nulas em `IGNORED`; a origem de UI não participa do matching. | ACEITA COMO PADRÃO | Permite retornar `executionId` antes do worker e preservar atividade sem seleção manual. | 2026-08-27 |
| DEC-15 | Múltiplos matches falham fechados e não produzem saídas. | ACEITA COMO PADRÃO | Evita escolha arbitrária ou respostas duplicadas em uma violação de integridade. | 2026-08-27 |
| DEC-16 | O browser gera uma chave técnica estável por submissão; o identificador opcional do comentário não é a única proteção idempotente. | ACEITA COMO PADRÃO | Protege retries HTTP mesmo quando o usuário não informa um ID de comentário. | 2026-08-27 |
| DEC-17 | Todo membro confirmado pode testar, consultar e reprocessar falhas no workspace ativo durante o MVP. | ACEITA COMO PADRÃO | Reutiliza a política da Fase 3 até existir RBAC granular. | 2026-08-27 |
| DEC-18 | Um claim já iniciado conclui com seu snapshot; pausa anterior ao claim impede seleção. | ACEITA COMO PADRÃO | Define a fronteira temporal entre “novo disparo” e execução em curso. | 2026-08-27 |

## Ticket Map

- [001 — Comentário idempotente cria execução consultável](../tickets/end-to-end-simulation/001-comentario-idempotente-cria-execucao-consultavel.md)
- [002 — Worker encontra revisão publicada ou ignora comentário](../tickets/end-to-end-simulation/002-worker-encontra-revisao-publicada-ou-ignora-comentario.md)
- [003 — Jornada simulada com resposta, DM e link](../tickets/end-to-end-simulation/003-jornada-simulada-com-resposta-dm-e-link.md)
- [004 — Captura de e-mail termina em solicitação simulada](../tickets/end-to-end-simulation/004-captura-email-termina-em-solicitacao-simulada.md)
- [005 — Falha e reprocessamento preservam idempotência](../tickets/end-to-end-simulation/005-falha-e-reprocessamento-preservam-idempotencia.md)
- [006 — Execução atualiza por SSE com recuperação HTTP](../tickets/end-to-end-simulation/006-execucao-atualiza-por-sse-com-recuperacao-http.md)
- [007 — Aba Testar apresenta experiência do seguidor](../tickets/end-to-end-simulation/007-aba-testar-apresenta-experiencia-do-seguidor.md)
- [008 — Aba Atividade agrupa interações e recupera falhas](../tickets/end-to-end-simulation/008-aba-atividade-agrupa-interacoes-e-recupera-falhas.md)
- [009 — Observabilidade e logs estruturados do pipeline de simulação](../tickets/end-to-end-simulation/009-observabilidade-e-logs-estruturados-do-pipeline-de-simulacao.md)
- [010 — Filtros por status, plataforma e modo, busca textual e paginação na aba de atividade](../tickets/end-to-end-simulation/010-filtros-busca-e-paginacao-na-aba-de-atividade.md)
- [011 — Limites de requisição para operações de simulação](../tickets/end-to-end-simulation/011-limites-de-requisicao-para-operacoes-de-simulacao.md)
- [012 — Limites de conexões SSE de simulação](../tickets/end-to-end-simulation/012-limites-de-conexoes-sse-de-simulacao.md)
- [013 — Encerramento verificável da Fase 4](../tickets/end-to-end-simulation/013-encerramento-verificavel-da-fase-4.md)

## Further Notes

- A PRD exigiu uma evolução aditiva do modelo lógico: execução existe antes do match e saídas são persistidas sem `Conversation`/`Message`. O `DATA-MODEL.md` foi reconciliado e a migration `0003_simulated_automation_executions` foi aplicada.
- `ExternalEvent` continua reservado ao fluxo real. Para esta fase, a identidade/input normalizado da execução é suficiente, com os contratos `interaction.received.v1` e `automation-execution` prontos para reuso por adapters futuros.
- A sinalização de mudanças em tempo real para o SSE utiliza Redis Pub/Sub desacoplado via porta, mantendo PostgreSQL como fonte autoritativa de verdade e recuperação integral por GET.
- A Fase 4 foi concluída e validada integralmente com a entrega dos tickets 001 a 013 e aprovação da suíte completa de testes e verificações.
