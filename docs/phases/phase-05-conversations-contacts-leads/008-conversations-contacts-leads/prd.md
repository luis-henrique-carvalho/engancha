# Fase 5 — Conversas, contatos e leads

## Source and Traceability

Esta PRD cobre o `EPIC-05 — Conversas, contatos e leads` e a Fase 5 do roadmap. Ela detalha `FR-DATA-001` a `FR-DATA-006`, conclui `FR-AUTO-008` e `FR-AUTO-009`, aplica `FR-CHANNEL-001`, `FR-CHANNEL-002`, `FR-CHANNEL-005` e `FR-CHANNEL-009`, e preserva `RN-001` a `RN-009` onde pertinentes.

As fontes são `docs/ROADMAP.md`, `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/DATA-MODEL.md`, a PRD `docs/phases/phase-04-end-to-end-simulation/005-end-to-end-simulation/prd.md`, o vocabulário de `CONTEXT.md` e as decisões aprovadas pelo usuário em 9 e 10 de setembro de 2026.

A Fase 4 é dependência concluída: ela persiste execuções e saídas simuladas, mas termina o fluxo de captura ao exibir a solicitação de e-mail. Esta fase transforma essas interações em histórico de produto e permite que o contato responda à solicitação.

## Problem Statement

O usuário já consegue executar e observar uma automação simulada, porém cada execução permanece isolada na atividade da automação. O produto ainda não consolida interações por pessoa, não mantém uma caixa de conversas, não captura efetivamente o e-mail solicitado e não transforma o contato em lead pesquisável.

Sem esta fase, o usuário consegue validar o motor, mas não obtém o resultado comercial esperado: reconhecer quem interagiu, acompanhar o histórico, segmentar contatos e consultar os leads gerados por cada automação.

## Goal and Scope

O objetivo é transformar cada execução simulada correspondente em uma conversa e um contato idempotentes e, no fluxo de captura, permitir que uma resposta posterior com e-mail válido crie ou atualize o contato e registre o primeiro lead atribuível.

Incluído:

- persistência de `Conversation`, `Message`, `Contact`, `Lead`, `Tag`, `ContactTag` e solicitação de captura de e-mail;
- projeção idempotente de comentário, resposta pública, DMs, link e solicitação de e-mail no histórico da conversa;
- criação do contato desde a primeira interação, antes de existir e-mail;
- uma conversa reutilizável por contato, provider, modo e conexão de canal;
- continuidade interativa da simulação depois da solicitação de e-mail;
- validação e normalização do e-mail em processamento assíncrono;
- criação ou atualização idempotente do contato e criação única do lead;
- uma tag opcional por automação, versionada e aplicada ao contato sem duplicidade;
- listas de conversas, contatos e leads, detalhe da conversa, visualização de tags e filtros básicos;
- isolamento integral pelo workspace ativo e identificação inequívoca dos dados simulados;
- índices, paginação por cursor, estados vazios, carregamento, erro e recuperação;
- observabilidade segura para projeção de mensagens e captura, sem registrar conteúdo sensível.

Não incluído:

- envio ou recebimento real por Instagram/Meta;
- OAuth, webhook, credenciais ou `ChannelConnection` real;
- caixa de entrada operacional com resposta manual do usuário do Engancha;
- edição, exclusão, mescla manual ou importação de contatos;
- cadastro e administração manual de tags fora da configuração da automação;
- múltiplas tags configuradas por automação;
- múltiplas conversões ou funil com etapas além de contato e lead;
- dashboard e métricas agregadas da Fase 6;
- retenção customizável, exportação, consentimento de marketing ou campanhas;
- unificação automática de identidades entre providers, modos ou pessoas conflitantes.

O critério de sucesso é uma automação simulada correspondente criar histórico consultável e contato, solicitar e receber um e-mail na experiência do seguidor, criar um lead e aplicar a tag configurada sem duplicar registros em retry, redelivery ou repetição da submissão.

## Actors and Permissions

- **Membro confirmado do workspace**: consulta as conversas, contatos e leads do workspace ativo; executa a simulação e informa o e-mail na experiência do seguidor; configura a tag opcional da automação conforme as permissões já adotadas no MVP.
- **Contato simulado**: identidade representada pelo autor da interação no provider simulado; pode existir sem e-mail e sem ser lead.
- **Sistema**: projeta mensagens, mantém a solicitação de captura, normaliza a resposta e cria ou atualiza contato, lead e tag de forma idempotente.
- **Worker**: processa projeções e respostas de captura com contratos versionados, sem confiar em workspace, provider ou modo enviados pelo browser.

Toda leitura e mutação exige sessão confirmada, Organization ativa e membership válido. Identificadores fornecidos pelo cliente servem para localizar recursos, nunca para autorizar acesso. Recursos de outro workspace devem responder sem revelar sua existência.

## User Stories

1. As a workspace member, I want matching simulations to become conversations, so that I can follow the complete history instead of isolated executions.
2. As a workspace member, I want each social identity to become a contact, so that repeated interactions accumulate around the same person.
3. As a simulated contact, I want to answer an e-mail request inside the follower journey, so that the automation can complete the promised capture experience.
4. As a workspace member, I want a valid e-mail response to create a lead attributed to the originating automation, so that I can identify the result of the campaign.
5. As a workspace member, I want an optional automation tag applied without duplication, so that I can segment contacts by interest or origin.
6. As a workspace member, I want to browse and filter conversations, contacts and leads, so that I can find relevant histories and captured opportunities.
7. As a workspace member, I want retries and repeated submissions to preserve one history and one lead, so that operational recovery does not corrupt my data.

## Functional Behavior

### From execution to conversation

1. A normalized simulated comment is accepted through the existing simulation flow.
2. The system resolves or creates a contact from the normalized provider identity inside the active workspace.
3. The system resolves or creates the conversation for that contact, provider, mode and connection context. In simulation, the connection remains null.
4. The incoming comment and every visible output are projected as ordered messages. Existing execution outputs remain the immutable execution record; messages are the product history.
5. Reprocessing the same execution or output resolves the same contact, conversation and message identities.
6. A matched execution links to its contact and conversation. `IGNORED` or failed interactions may remain visible in activity, but do not invent sent messages.

The message sequence for a link flow is:

```text
COMMENT → PUBLIC_REPLY → DIRECT_MESSAGE → DIRECT_MESSAGE_WITH_LINK
```

The message sequence for an e-mail flow is:

```text
COMMENT → PUBLIC_REPLY → DIRECT_MESSAGE → EMAIL_CAPTURE_REQUEST
```

Product projections may present the final link or e-mail request as a specialized DM, while preserving the underlying message kind needed for traceability.

### Contact identity and conversation reuse

- In simulation, the normalized author identity supplies the stable external user identity for the selected provider and mode.
- A repeated interaction from the same workspace, provider, mode, connection context and external user identity updates `lastInteractionAt` and reuses the contact.
- The same identity reuses its existing conversation and appends messages in chronological order.
- Identities from different workspaces, providers or modes are never unified implicitly.
- Adding a valid e-mail enriches the existing contact; it does not replace conversation history or create a second person.

### Optional automation tag

- The automation editor allows zero or one tag in the revision being edited.
- The user selects an existing workspace tag or creates it inline by name; normalization prevents duplicate names inside the workspace.
- Publication snapshots the tag action with the other ordered actions.
- When a matching execution resolves the contact and reaches the tag action, the system applies the tag once and records the application in execution traceability.
- A tag may be applied to a contact before that contact becomes a lead. Lead creation does not move or duplicate the tag.

### Interactive e-mail capture

1. An e-mail capture action persists and displays its request message, then the originating automation execution reaches `COMPLETED` as it does today.
2. The conversation receives a persisted e-mail capture request linked to the contact, request message, automation and originating execution.
3. The Testar experience reveals an accessible e-mail input only for the current pending request.
4. The browser submits the response with a stable idempotency key. The API validates shape and access, persists or resolves the inbound response identity, and requests asynchronous processing.
5. The worker reloads authoritative context, validates that the request is still pending, normalizes the e-mail, resolves identity conflicts and commits the response message, contact update, lead and tag effects atomically.
6. On success, the request becomes completed and the UI reconciles through the authoritative HTTP projection, with real-time notification where available.

The originating execution is never reopened. The completed request retains attribution to that execution and automation revision.

### Validation, retry and recovery

- Leading and trailing whitespace is removed and the domain portion is normalized case-insensitively. The original accepted address remains available for display while uniqueness uses `emailNormalized`.
- An invalid e-mail does not create a response message, update a contact or create a lead. The request remains pending and the user can correct the value.
- Repeating the same submission returns the existing result and produces no duplicate message, contact, lead or tag association.
- A transient processing failure keeps the response recoverable through retry/backoff and displays a safe retry state. It never exposes queue, worker, raw payload or stack-trace language.
- If the provider identity and normalized e-mail resolve to different existing contacts, processing fails closed with a clear conflict result. Neither contact is merged or reassigned, no lead is created and the request remains available for a different address.
- Logging and telemetry may include opaque identifiers and outcomes, but not full message text, e-mail address, link content or provider payload.

### One pending request per conversation

- Creating a new e-mail capture request supersedes the previous pending request in the same conversation.
- The superseded request remains in history, cannot accept a response and explains that a newer request replaced it.
- A response racing with supersession succeeds only if it atomically claims the request while still pending; otherwise it resolves to the newer authoritative state without side effects.
- Completed requests are historical and are never changed by later requests.

### Lead behavior

- The first valid e-mail capture creates the workspace lead and fixes its initial `capturedAt`, automation and execution attribution.
- A contact that is already a lead remains the same lead. A later valid capture does not overwrite initial attribution or create another lead.
- A repeated valid capture may update the contact only when identity and normalized e-mail are consistent, append the new inbound message and apply the current automation tag idempotently.
- Lists and detail projections make clear that a lead is a state of a contact, not a separate person.

### Product lists and detail

- **Conversas** lists the most recently active conversations with contact identity, last message preview, provider, simulated marker, automation context, lead state, tags and last activity.
- **Detalhe da conversa** shows the ordered message history, direction and message type, origin automation/execution and e-mail-capture states without technical infrastructure vocabulary.
- **Contatos** lists identity, e-mail when present, provider/mode, tags, lead state and last interaction.
- **Leads** lists the contact identity, e-mail, first capture date, originating automation and tags.
- Lists use cursor pagination and stable ordering. Filters live in the URL where consistent with existing product-list conventions.
- Conversation filters cover period, execution status, automation, lead presence and tag. Contact and lead lists support textual search, provider/mode, tag and lead state where applicable.
- Empty, loading, no-results, recoverable error and forbidden states are distinct and accessible.

## Domain Rules and Data

### Core relationships

```text
Organization
├── Contact
│   ├── Conversation[]
│   │   ├── Message[]
│   │   └── EmailCaptureRequest[]
│   ├── Lead?                 (zero or one in the MVP)
│   └── ContactTag[] ── Tag
└── AutomationExecution[] ── Conversation? / Contact?
```

- Every product record belongs directly or transitively to one Organization; joins across organizations are invalid.
- Provider and mode are separate dimensions on conversations, messages, contacts, leads and execution traceability.
- Simulated records require `mode=SIMULATED` and null connection. The API, not the browser, determines mode.
- A contact is unique by non-null normalized e-mail within a workspace and independently by non-null provider identity within the workspace/channel context.
- One conversation is active as the accumulated history for a contact, provider, mode and connection context.
- Message identity is deterministic from its authoritative source. Projecting an execution output or accepting the same input twice resolves the existing message.
- A lead is unique per workspace and contact. Its first-capture attribution is immutable in the MVP.
- Tag names are unique after normalization inside a workspace, and a contact/tag pair exists at most once.

### E-mail capture request

The persisted request contains, at minimum:

- workspace, conversation and contact;
- automation, revision and originating execution;
- request message and optional accepted response message;
- status `PENDING`, `PROCESSING`, `COMPLETED` or `SUPERSEDED`;
- stable submission identity, attempts and safe failure classification when processing was requested;
- creation, processing and completion timestamps.

Only `PENDING` can be claimed for processing. Only one request may be pending or processing for a conversation. A new request supersedes the prior pending request atomically; it must not supersede one already claimed for processing.

### Consistency and privacy

- Contact identity resolution, conversation resolution and creation of messages for one execution are transactional or protected by database uniqueness so concurrent workers converge on one result.
- Claiming a capture and committing its response message, contact e-mail, first lead and tag associations form one consistency boundary.
- E-mail uniqueness conflicts are business conflicts, not retryable infrastructure failures.
- Message text and contact e-mail are customer data. They may be returned only in authorized product projections and must be redacted from logs and public errors.
- Deleting or retaining this data beyond existing product policy is deferred; no automatic purge is introduced in this phase.

## Contracts and Integrations

Protected REST contracts under `/api/v1`:

- `GET /conversations`: cursor-paginated, filtered workspace conversation summaries.
- `GET /conversations/:id`: authorized conversation detail with ordered messages and capture state.
- `POST /conversations/:id/email-captures/:captureId/responses`: idempotently accepts the simulated follower response and returns the current processing projection.
- `GET /contacts`: cursor-paginated, searchable workspace contact summaries.
- `GET /leads`: cursor-paginated, searchable workspace lead summaries.
- tag lookup/inline creation is exposed through the automation configuration contract rather than a standalone administration surface in this phase.

The response submission contract does not accept organization, mode, provider, automation or execution as trusted fields. Those values are derived from the authorized capture request.

Shared contracts define:

- conversation summaries and detailed message projections;
- contact, lead and tag summaries;
- cursor/filter schemas and stable sort keys;
- strict e-mail response request and processing response;
- versioned job/event envelopes for capture processing and `lead.captured`;
- user-safe conflict and retry states.

The existing simulation result projection gains conversation and pending-capture references so Testar can continue the same follower journey. Real-time delivery remains an optimization over authoritative PostgreSQL reads and must preserve HTTP recovery.

No external provider integration is added. Provider-specific payloads remain outside the normalized contracts and core domain modules.

## Acceptance Criteria

### Conversation and message history

- [ ] A matching simulated comment creates or reuses one contact and one conversation in the active workspace.
- [ ] Comment, public reply, DM, final link/e-mail request and later accepted response appear once, in order, with provider and simulated state.
- [ ] Repeated simulations from the same normalized identity append to the same conversation; other workspace, provider or mode contexts remain isolated.
- [ ] Worker redelivery, automatic retry and manual reprocessing create no duplicate conversation or message.
- [ ] Existing execution/output history remains immutable and links to the projected product history.

### Contact and identity

- [ ] A contact exists after the first matching interaction even without e-mail or lead state.
- [ ] A valid captured e-mail is normalized and added to the existing contact without losing its history.
- [ ] The same normalized e-mail cannot create duplicate contacts inside one workspace but may exist independently in another workspace.
- [ ] Conflicting provider-identity and e-mail matches fail closed without merging, reassignment or lead creation.

### Interactive capture and lead

- [ ] Testar presents an accessible e-mail input only after an e-mail request and submits it idempotently.
- [ ] Invalid input leaves the request pending, explains the validation problem and permits correction without side effects.
- [ ] The originating execution remains completed while the persisted request moves independently through pending, processing, completed or superseded states.
- [ ] A successful response appends the inbound message and atomically creates or resolves the contact, first lead and applicable tag effects.
- [ ] The lead preserves the first valid capture date, automation and execution; subsequent valid captures do not duplicate it or rewrite attribution.
- [ ] A newer request supersedes an older pending request in the same conversation, and a race cannot complete both.
- [ ] Transient failures can recover without duplicate effects; permanent identity conflicts remain safe and understandable.

### Tags

- [ ] An automation revision supports zero or one workspace tag and shows it in review before publication.
- [ ] Inline tag creation and selection enforce normalized workspace uniqueness and reject foreign-workspace identifiers.
- [ ] A matching execution applies the configured tag to the contact once and records traceability even before lead conversion.
- [ ] Tags appear consistently in conversation, contact and lead projections.

### Lists, detail and authorization

- [ ] Conversation, contact and lead lists are cursor-paginated, stably ordered and scoped to the active workspace.
- [ ] Conversation detail presents an accessible, chronological product history with capture states and no infrastructure terminology.
- [ ] Required period, execution status, automation, lead and tag filters work without cross-workspace leakage.
- [ ] Search and applicable provider/mode/tag filters distinguish empty, no-results, loading and recoverable-error states.
- [ ] Direct identifiers from another workspace cannot read or mutate contact, conversation, capture, lead or tag data.

### Quality and observability

- [ ] Contract, unit, PostgreSQL integration, worker, API E2E, web and full local E2E tests cover success, conflict, supersession, concurrency, retry, idempotency and tenant isolation.
- [ ] Logs correlate opaque workspace, conversation, contact, capture, execution and job identifiers without full message text, e-mail, links or raw payloads.
- [ ] Migrations and indexes enforce invariants under concurrent processing and support list/filter access paths.
- [ ] Typecheck, lint, formatter and the complete relevant test suites pass before phase closure.

## Implementation Decisions

- Introduce distinct `Conversations` and `Contacts` modules. `Conversations` owns conversation history, messages and e-mail capture lifecycle; `Contacts` owns contact identity resolution, lead conversion and tag associations.
- Keep the external interfaces of both modules small: resolve/append conversation history, accept/complete a capture, resolve contact identity and record conversion. Uniqueness, conflicts, supersession and transaction ordering remain hidden inside their implementations.
- Let `Simulation` orchestrate the existing interaction path through module interfaces rather than write conversation or contact tables directly. The worker uses the same interfaces for redelivery and response processing.
- Keep `Automations` responsible for validating and snapshotting the optional tag action. It consults tag lookup through a narrow interface and does not own tag persistence.
- Preserve execution outputs as immutable evidence of what the engine produced. Conversation messages are an idempotent product projection linked to those sources, not a replacement or mutable alias.
- Model e-mail capture lifecycle separately from execution status. A future contact response must not reopen, mutate or prolong the originating automation execution.
- Use database constraints and conditional transactional writes as the final idempotency and concurrency guard; queue or HTTP deduplication alone is insufficient.
- Publish capture processing and lead facts only after their database transaction commits. Consumers receive opaque identities and reload authoritative state.
- Keep query projections optimized for product lists and details without exposing persistence models as public contracts.
- Follow the established web feature organization: routes compose views; views delegate HTTP/query/cache behavior to hooks and services; shared data modules own schemas, filters and mappers.

## Testing Decisions

- Unit tests cover author/e-mail/tag normalization, identity-resolution outcomes, message ordering, capture state transitions, supersession, lead first-attribution and user-safe error mapping.
- Contract tests cover strict list filters, pagination cursors, message projections, response submission, job/event versions and rejection of client-supplied tenant/channel context.
- PostgreSQL integration tests cover partial uniqueness, concurrent contact/conversation upsert, deterministic message identity, single active capture, atomic claim, e-mail conflicts, first lead and contact/tag uniqueness.
- Worker integration tests cover projection redelivery, capture processing, retry/backoff, stale or superseded requests, invalid jobs and survival after business or infrastructure failures.
- API E2E tests cover lists and detail, response submission, polling/reconciliation, idempotency, conflict, pagination/filter stability and cross-workspace authorization.
- Web tests cover inline tag configuration/review, conversation/contact/lead states, follower e-mail input, validation, processing/retry/conflict/superseded feedback, responsive behavior and accessibility.
- A full local E2E test proves comment → execution → conversation/messages → e-mail response → worker → contact/lead/tag → authorized lists, with PostgreSQL and Redis and no external provider.

## Out of Scope

- Real-channel connections, webhook ingestion and provider delivery.
- Manual outbound replies, agent assignment, unread counters, inbox collaboration or conversation closure workflows.
- Contact editing, deletion, automatic merge, import, export or cross-provider identity resolution.
- Tag administration, bulk tagging, tag removal and more than one configured automation tag.
- Lead stages, scoring, ownership, notes, multiple conversion records or CRM synchronization.
- Marketing consent, double opt-in, suppression lists and outbound e-mail campaigns.
- Analytics/dashboard calculations, alerts or reports derived from the new records.
- User-configurable retention, anonymization or legal-hold policies.

## Decision Log

| ID | Decision | Status | Impact | Date |
| --- | --- | --- | --- | --- |
| DEC-01 | A captura é interativa: o contato responde depois que a automação exibe a solicitação de e-mail. | RESOLVIDA | Valida a jornada real de captura em vez de injetar um endereço antes da simulação. | 2026-09-09 |
| DEC-02 | Cada automação pode configurar zero ou uma tag opcional. | RESOLVIDA | Entrega segmentação simples sem antecipar gestão avançada ou múltiplas tags. | 2026-09-09 |
| DEC-03 | Interações da mesma identidade reutilizam uma conversa por contato, provider, modo e conexão. | RESOLVIDA | Produz histórico contínuo sem unir contextos de canal distintos. | 2026-09-09 |
| DEC-04 | A execução termina após solicitar o e-mail; uma solicitação persistida recebe e processa a resposta futura sem reabrir a execução. | RESOLVIDA | Separa execução imutável de uma espera que pode nunca terminar. | 2026-09-09 |
| DEC-05 | Conflito entre identidade do provider e dono do e-mail falha fechado, sem mescla automática. | RESOLVIDA | Evita unir pessoas ou reatribuir histórico por engano. | 2026-09-09 |
| DEC-06 | Apenas uma solicitação fica pendente por conversa; uma nova solicitação substitui a anterior, marcada como superseded. | RESOLVIDA | Remove ambiguidade de atribuição e torna corridas determinísticas. | 2026-09-10 |
| DEC-07 | O contato nasce na primeira interação e a identidade simulada normalizada representa o usuário externo no MVP. | ACEITA COMO PADRÃO | Segue o modelo de dados e permite conversa antes da captura. | 2026-09-10 |
| DEC-08 | A primeira captura válida fixa a atribuição do lead; capturas posteriores não criam outro lead nem reescrevem a origem. | ACEITA COMO PADRÃO | Aplica a unicidade de lead por contato já definida no modelo de dados. | 2026-09-10 |
| DEC-09 | A tag é uma ação versionada aplicada ao contato quando a execução correspondente alcança essa ação. | ACEITA COMO PADRÃO | Preserva revisão/snapshot e permite segmentar contatos ainda não convertidos. | 2026-09-10 |
| DEC-10 | As três listas e o detalhe de conversa seguem o roadmap, com paginação por cursor e filtros nos padrões já usados pelo produto. | ACEITA COMO PADRÃO | Evita uma nova decisão de navegação e mantém consistência com superfícies existentes. | 2026-09-10 |

## Ticket Map

- [001 — Comentário cria contato, conversa e mensagem de entrada](./tickets/001-comment-creates-contact-conversation-inbound-message.md)
- [002 — Saídas da execução formam histórico ordenado e idempotente](./tickets/002-execution-outputs-build-idempotent-ordered-history.md)
- [003 — Automação configura e aplica tag opcional](./tickets/003-automation-configures-and-applies-optional-tag.md)
- [004 — Resposta de e-mail enriquece contato e cria primeiro lead](./tickets/004-email-response-enriches-contact-and-creates-first-lead.md)
- [005 — Captura trata conflito, substituição, concorrência e retry](./tickets/005-email-capture-handles-conflict-supersession-concurrency-and-retry.md)
- [006 — Aba Testar continua jornada com resposta de e-mail](./tickets/006-test-tab-continues-journey-with-email-response.md)
- [007 — Lista de conversas oferece busca, filtros e paginação](./tickets/007-conversations-list-search-filters-pagination.md)
- [008 — Detalhe da conversa mostra histórico e estado da captura](./tickets/008-conversation-detail-shows-history-and-capture-state.md)
- [009 — Lista de contatos mostra identidade, tags e estado de lead](./tickets/009-contacts-list-shows-identity-tags-and-lead-state.md)
- [010 — Lista de leads mostra origem, captura, tags e filtros](./tickets/010-leads-list-shows-origin-capture-tags-and-filters.md)
- [011 — Encerramento verificável da Fase 5](./tickets/011-phase-5-verifiable-completion.md)

## Further Notes

- O modelo de dados existente já prevê as entidades centrais e `APPLY_TAG`; a implementação precisará reconciliar a solicitação persistida de captura, as identidades determinísticas de mensagem e os índices parciais necessários às regras aprovadas.
- A decisão de não reabrir a execução mantém compatibilidade com a conclusão da Fase 4 e evita introduzir um estado de execução aguardando entrada indefinidamente.
- O evento `lead.captured` passa a ter produção concreta nesta fase e deverá carregar somente identificadores e metadados seguros.
- Dados simulados continuam claramente marcados como simulação. A modelagem preserva provider, modo e conexão para que adapters reais possam reutilizar as interfaces sem importar payloads específicos para o domínio.
- Política customizável de retenção, consentimento de marketing e mescla assistida exigem decisões próprias antes de qualquer uso real com dados pessoais.
