# Fase 2 — Autenticação, workspaces e isolamento por Organization

## Source and Traceability

Esta PRD cobre a Fase 2 do [roadmap](../ROADMAP.md), os épicos `EPIC-01` e `EPIC-02` de [requisitos](../REQUIREMENTS.md), e o modelo de `organization` e `member` definido em [DATA-MODEL.md](../DATA-MODEL.md).

Requisitos cobertos: `FR-AUTH-001` a `FR-AUTH-006`, `FR-WORK-001`, `FR-WORK-002`, `FR-WORK-004`, `FR-WORK-005`, `RN-001` e `RN-008`. `FR-WORK-003` fica preparado pelo Organization Plugin, mas sua interface de troca não é parte deste slice. A decisão de incluir confirmação de e-mail, recuperação de senha, Resend e Google OAuth foi confirmada pelo usuário em 2026-08-13 (`DEC-01`).

## Problem Statement

A fundação atual consegue executar web, API, worker, PostgreSQL, Redis e filas, mas não possui identidade persistida, sessão, workspace ativo nem uma fronteira de autorização multi-tenant. Sem isso, as fases de automações, conversas e dashboard não têm como associar dados a um usuário autorizado ou impedir vazamento entre Organizations.

## Goal and Scope

Entregar um caminho completo e seguro para uma pessoa criar ou acessar uma conta, confirmar seu e-mail, recuperar a senha quando necessário, usar Google OAuth em ambiente configurado e chegar a um workspace padrão ativo. Cada requisição de produto deverá derivar o contexto de Organization da sessão e rejeitar acesso fora do membership.

Incluído:

- bootstrap inicial de Prisma/PostgreSQL, Better Auth hospedado na API com adaptador Prisma e Organization Plugin;
- cadastro e login por e-mail/senha, confirmação de e-mail obrigatória, reenvio com limite de taxa, recuperação de senha e logout;
- sessão em cookie HTTP-only, consumida pelo frontend com credenciais incluídas;
- Google OAuth com validação de e-mail e account linking seguro;
- entrega assíncrona dos e-mails transacionais por Resend e pela fila `email-delivery`;
- criação idempotente de uma Organization padrão, com o primeiro usuário como owner;
- contexto de workspace ativo no backend e no frontend, com estado recuperável quando ausente;
- guard/regras reutilizáveis que validam sessão, Organization ativa e membership;
- contratos e convenções para que consultas e mutações futuras sejam sempre escopadas à Organization ativa;
- páginas e estados de autenticação, confirmação, recuperação e workspace inicial.

Não incluído:

- convites, gestão de membros, alteração de papéis ou UI para alternar entre múltiplos workspaces;
- entidades de produto de automações, contatos, conversas, leads, execuções ou suas queries;
- integração real com Instagram/Meta;
- Bull Board e regras administrativas;
- CORS multi-origem de produção além da configuração segura necessária ao ambiente local e à arquitetura first-party.

O sucesso é verificável quando uma pessoa confirmada chega ao produto com um workspace ativo; uma pessoa não confirmada não chega; a recuperação e o logout funcionam; e chamadas protegidas só recebem o contexto da Organization da própria sessão.

## Actors and Permissions

- Visitante: pode cadastrar-se, entrar, iniciar OAuth, solicitar confirmação ou recuperação; não acessa rotas de produto.
- Usuário autenticado não confirmado: possui identidade e pode reenviar confirmação, mas não acessa o produto.
- Membro do workspace: usuário autenticado, confirmado e membro da Organization ativa; acessa somente dados desse workspace.
- Owner inicial: primeiro membro da Organization padrão, com papel `owner` provido pelo Better Auth Organization Plugin.
- Worker de e-mail: consome jobs de entrega e chama Resend; não possui sessão de usuário nem autorização de produto.
- Administrador de plataforma: permanece fora deste fluxo; nenhuma elevação administrativa é adicionada nesta fase.

## User Stories

1. As a visitor, I want to create an account with my name, email, and password, so that I can begin using Engancha after verifying my identity.
2. As a user, I want to confirm or resend confirmation of my email, so that I can unlock access safely when the original link is unavailable.
3. As a user, I want to sign in with email/password or Google and keep a secure session, so that I can return to my workspace without exposing credentials to the browser.
4. As a user, I want to reset my password and sign out, so that I can recover or end access safely.
5. As a first-time authorized user, I want a default workspace ready for me, so that I can enter the product without manual tenant setup.
6. As a workspace member, I want the active workspace shown by the application, so that I know the data context I am using.
7. As a workspace member, I want data requests scoped to my active membership, so that other Organizations' data is never visible or modifiable.
8. As a future feature developer, I want an authorization context and guard that are reusable, so that every product endpoint applies the same tenant boundary.

## Functional Behavior

### Registration, verification, and sign-in

1. A visitor submits name, normalized email, and password through the public web flow.
2. Better Auth validates credentials and creates the identity only once for the normalized email.
3. The API creates a verification URL/token through Better Auth and enqueues a typed `email-delivery` job; the worker sends it with Resend.
4. The browser receives a neutral success state telling the visitor to confirm the address. It cannot load protected product routes until `emailVerified` is true.
5. A valid verification link marks the address verified. Invalid, expired, already-consumed, delivery-failed, and rate-limited states are explicit and recoverable without leaking sensitive data.
6. Email/password login creates a secure session only according to the configured Better Auth verification rule. Invalid credentials use one generic error message.
7. Google OAuth returns through Better Auth. Only a verified Google email gains product access. Linking does not automatically link different email addresses.

### Password recovery and logout

1. A visitor may request a password-reset link with a response that does not reveal whether the email exists.
2. The reset email follows the same queued delivery flow; its token lifecycle and password policy are controlled by Better Auth.
3. A successful reset follows Better Auth's session invalidation policy. Invalid or expired links present a recoverable error.
4. Logout invalidates the current session and returns the browser to an unauthenticated state.

### Default workspace and active context

1. After an authenticated, confirmed user first reaches the protected bootstrap flow, the API ensures an Organization exists for that user.
2. Concurrent bootstrap attempts yield one default Organization and one owner membership. Name and slug are derived through deterministic, collision-safe rules.
3. The Organization is made active through the Better Auth Organization Plugin/session mechanism, then returned as workspace context.
4. On later visits the API loads the active Organization from the authenticated session and verifies current membership before exposing it to the frontend.
5. The layout displays the active workspace name. A missing or stale active context offers a recoverable bootstrap/retry state rather than silently selecting a client-provided Organization.

### Authorization and isolation

1. Public auth routes and health checks are the only endpoints that do not require a product context.
2. Every protected product request resolves `userId`, active `organizationId`, and membership server-side from the session.
3. A client-provided `organizationId` can be treated as input only where a future API needs it to request a switch; it is never authorization evidence.
4. Repositories/use cases for product data receive the resolved Organization context and always include it in reads and writes.
5. Access to a resource outside the active Organization returns `404 Not Found`, avoiding resource-existence disclosure. Absent or invalid session/context returns the appropriate authentication or authorization error.
6. Structured logs may contain correlation IDs, user IDs and organization IDs where available, but never session tokens, OAuth tokens, reset tokens, passwords, Resend keys or provider secrets.

## Domain Rules and Data

Better Auth owns `user`, `session`, `account`, `verification`, `organization`, `member`, and `invitation`. The application must not create parallel user, organization, or membership tables.

Esta fase inicializa Prisma para PostgreSQL e gera o schema requerido pela instância configurada do Better Auth e pelo Organization Plugin. Como o CLI do Better Auth gera schema para o adapter Prisma, mas não cria migrations Prisma, o fluxo é: gerar/reconciliar o schema com o CLI do Better Auth, validar o schema e criar uma migration versionada pelo fluxo do Prisma. O cliente Prisma usado pela API deve respeitar a forma de geração exigida pela versão escolhida do Prisma.

`organization.slug` permanece globalmente único. A criação da Organization padrão usa as APIs do plugin com a sessão do usuário e define explicitamente a Organization ativa na sessão. A camada de aplicação acrescenta a estratégia de concorrência/idempotência necessária para que tentativas simultâneas não criem workspaces ou memberships padrão duplicados.

The active Organization belongs to the server-side authenticated session/context. All future product records must carry `organizationId`; their write path receives the value from the resolved context, not from the browser. A membership that has been removed or no longer exists invalidates access to that Organization.

Email delivery jobs contain only the minimum render/send data required by the worker. Verification and reset URLs/tokens are never logged and are retained only for the Better Auth lifecycle. Repeated resend requests are rate-limited by a server-side key; delivery retries use the queue policy and failures become observable without changing account verification status.

## Contracts and Integrations

- Better Auth routes are mounted under `/api/auth/*`; product REST APIs retain `/api/v1/*`.
- `packages/contracts` defines versioned schemas for `email-delivery` jobs and any frontend-safe workspace-context response needed by this phase; it remains independent of NestJS, Prisma, Redis and BullMQ.
- The API owns the Better Auth configuration, Prisma adapter, request/session integration, organization bootstrap, and authorization guard/context.
- The worker owns the `email-delivery` processor and the Resend adapter. It validates the shared job schema before sending.
- The web app calls auth/session endpoints with credentials included and never stores session credentials or provider secrets in browser storage.
- Required runtime configuration includes Better Auth secret/base URL, database URL, public web/API origin as applicable, Resend API key/sender, and Google client ID/secret/callback configuration. `trustedOrigins` is an allowlist explícita da origem web; o modo de produção mantém cookies seguros e first-party. Startup validates required values only for enabled integrations; Google and Resend end-to-end verification require real credentials.

## Acceptance Criteria

- [ ] The API uses Better Auth with a Prisma/PostgreSQL adapter and the Organization Plugin; its managed schema is migrated reproducibly.
- [ ] The initial Prisma configuration generates the Better Auth schema and records a Prisma migration; Better Auth CLI migration commands are not used for the Prisma adapter.
- [ ] A visitor can register with valid name, normalized email, and password; duplicate emails do not create another account.
- [ ] Registration, sign-in, and protected routes enforce mandatory email confirmation; invalid credentials and reset requests do not reveal account existence.
- [ ] Confirmation, resend, and password-reset messages are produced through Better Auth and delivered through `email-delivery` with Resend, retries and rate limiting.
- [ ] A user can confirm a valid link, receives a recoverable state for invalid/expired links, can reset a password, and can log out of the current session.
- [ ] Email/password sign-in creates a cookie HTTP-only session; the frontend consumes it without storing credentials client-side.
- [ ] Google OAuth is enabled with verified-email access and safe account-linking rules; configuration absence is actionable and does not break unrelated local flows.
- [ ] The first authorized access creates exactly one valid default Organization and owner membership even under concurrent requests.
- [ ] The API exposes a verified active-workspace context and the web layout displays it with loading, error, and recovery states.
- [ ] Protected product routes resolve session, active Organization, and membership server-side; an organization ID from the client alone cannot cross the tenant boundary.
- [ ] A cross-Organization resource access does not reveal the resource and returns the chosen `404` policy.
- [ ] Automated tests cover successful and failing auth flows, session/cookie behavior, queued email contracts/processor behavior, default-Organization idempotency, active-context recovery, and isolation attempts.

## Implementation Decisions

- Keep Better Auth as the sole source for authentication, sessions, users and Organizations. Wrap plugin calls in the `auth` and `workspaces` application boundaries instead of coupling future domains directly to Better Auth.
- Use the Better Auth Prisma adapter and generate the schema after the auth instance/plugins are configured. Apply it through a versioned Prisma migration, never through Better Auth's database migration command, which does not support the Prisma adapter.
- Integrate Better Auth with NestJS using the documented Nest adapter pattern, including bootstrap with the Nest body parser disabled so Better Auth receives its request body. The auth guard's public-route exceptions explicitly preserve health checks and all `/api/auth/*` flows; the protected product boundary remains under `/api/v1/*`.
- Serve authentication from the NestJS API and keep browser/API cookies first-party through the production routing architecture already documented.
- Require verified email for all product access. Account linking is enabled only under matching-email, verified-email rules.
- Enqueue transactional sends rather than calling Resend in an HTTP request. Persisting/controlling verification tokens remains Better Auth's responsibility.
- Bootstrap the default workspace after authorized access, not while creating an unverified identity. Create it through the Organization Plugin under the authenticated session, set it explicitly as active in that session, and make the operation idempotent and membership-aware.
- Resolve an immutable request-scoped authorization context at the API boundary and pass it into use cases/repositories. Do not let application code derive tenant scope from arbitrary request DTOs.
- Use `404` for cross-Organization resource IDs, `401` for missing/invalid sessions, and a recoverable context error for a valid session without a usable active Organization.
- Implement the workspace selector as a non-switching display for the single-workspace MVP; retain the Organization Plugin API surface needed to add switching later.
- Configure explicit trusted origins, built-in Better Auth rate limits for sensitive auth routes, secure production cookies, and safe account linking (`allowDifferentEmails: false`; Google only as a trusted provider when its verified-email behavior is validated).

## Testing Decisions

- Unit tests cover input normalization, workspace-name/slug generation, authorization-context resolution, membership decisions, resend rate-limit decisions, and safe error mapping.
- Integration tests run Better Auth against PostgreSQL/Prisma and verify registration, session creation, verification gating, reset, logout, Organization Plugin persistence, default bootstrap, and concurrent idempotency.
- Queue/worker tests validate the versioned email job, Resend adapter success/retry/permanent failure behavior, and ensure secrets/tokens are absent from structured logs.
- API E2E tests assert cookie attributes and `401`/`404` boundary behavior, including attempts to access another Organization with guessed or client-supplied identifiers.
- Web E2E tests cover registration, confirmation-pending, sign-in, OAuth error return, password recovery, logout, and active-workspace loading/recovery. External provider calls are mocked except for credentialed manual smoke tests.

## Out of Scope

- Inviting members, managing roles, deleting Organizations, renaming workspaces, or switching among multiple active Organizations.
- Product-domain tables and endpoints beyond the minimal protected-context probe needed to prove authorization behavior.
- A production email-template design system, marketing email, deliverability analytics, or a generalized notification service.
- Instagram/Meta authentication, provider credentials, and all customer channel integrations.
- Platform-administrator roles and Bull Board access control.

## Decision Log

| ID | Decision | Status | Impact | Date |
| --- | --- | --- | --- | --- |
| DEC-01 | Incluir nesta Fase 2 e-mail/senha, confirmação, recuperação de senha, Resend, Google OAuth, sessões e Organization Plugin sob Better Auth. | RESOLVIDA | Entrega todo o escopo de autenticação previsto no roadmap em vez de separar integrações externas. | 2026-08-13 |
| DEC-02 | Exigir e-mail confirmado para acessar qualquer rota de produto. | ACEITA COMO PADRÃO | Alinha `FR-AUTH-001`–`004` e evita criar workspace para identidade não confirmada. | 2026-08-13 |
| DEC-03 | Criar a Organization padrão após o primeiro acesso autorizado, com o usuário como owner e operação idempotente. | RESOLVIDA | Define o ponto de bootstrap e protege contra duplicação concorrente. | 2026-08-13 |
| DEC-04 | Derivar a Organization ativa da sessão/membership e responder `404` para recursos de outra Organization. | ACEITA COMO PADRÃO | Centraliza isolamento, evita enumeração de recursos e elimina confiança no ID enviado pelo cliente. | 2026-08-13 |
| DEC-05 | Enfileirar confirmações e resets em `email-delivery`; o worker envia via Resend. | RESOLVIDA | Mantém o envio resiliente e respeita a arquitetura API → BullMQ → worker. | 2026-08-13 |
| DEC-06 | Para Prisma, gerar o schema com o CLI do Better Auth e criar/aplicar a migration pelo fluxo versionado do Prisma. | ACEITA COMO PADRÃO | Segue a limitação documentada do adapter Prisma e evita migrations não reproduzíveis. | 2026-08-13 |
| DEC-07 | Criar a Organization padrão pelo plugin e defini-la explicitamente como ativa na sessão. | ACEITA COMO PADRÃO | Usa o mecanismo nativo de active Organization e mantém o contexto no servidor. | 2026-08-13 |

## Further Notes

- Credenciais reais de Google OAuth e Resend são bloqueios somente para testes end-to-end reais; contratos, configuração validada e fluxos com adapters/mocks podem ser desenvolvidos sem elas.
- A política precisa de expiração, invalidação de sessões e senha segue as capacidades/configuração do Better Auth e deve ser fixada junto da versão escolhida durante a implementação.
- A documentação atual de Organization e Google aparece na linha beta `v1.7`; o ticket de configuração deve fixar uma versão compatível de Better Auth e executar um smoke test de schema, sessão e OAuth callback antes de expandir integrações.
- A fase seguinte deverá usar o authorization context desta PRD ao criar qualquer entidade com `organizationId`; nenhum endpoint de produto pode criar seu próprio mecanismo de tenant resolution.
- O mecanismo de troca de workspace será acrescentado quando houver mais de uma Organization por usuário, sem alterar as garantias de membership desta fase.

## Documentation Links

Referências oficiais consultadas para a implementação e para os testes desta fase:

- [Better Auth — instalação](https://better-auth.com/docs/installation)
- [Better Auth — adapter Prisma](https://better-auth.com/docs/adapters/prisma)
- [Better Auth — banco de dados e geração de schema](https://better-auth.com/docs/concepts/database)
- [Better Auth — CLI](https://better-auth.com/docs/concepts/cli)
- [Better Auth — integração com NestJS](https://better-auth.com/docs/integrations/nestjs)
- [Better Auth — e-mail, verificação e reset de senha](https://better-auth.com/docs/concepts/email)
- [Better Auth — Organization Plugin](https://better-auth.com/docs/beta/plugins/organization)
- [Better Auth — Google](https://better-auth.com/docs/beta/authentication/google)
- [Better Auth — OAuth](https://better-auth.com/docs/concepts/oauth)
- [Better Auth — opções: conta, sessões, e-mail e trusted origins](https://better-auth.com/docs/reference/options)
- [Better Auth — cookies](https://better-auth.com/docs/concepts/cookies)
- [Better Auth — segurança](https://better-auth.com/docs/reference/security)
- [Better Auth — rate limiting](https://better-auth.com/docs/concepts/rate-limit)

## Ticket Map

- [001 — Cadastro e sessão e-mail/senha com Prisma e Better Auth](../tickets/authentication-workspaces-organization-isolation/001-cadastro-sessao-email-senha-prisma-better-auth.md)
- [002 — Confirmação de e-mail e entrega Resend por fila](../tickets/authentication-workspaces-organization-isolation/002-confirmacao-email-entrega-resend-fila.md)
- [003 — Recuperação de senha e logout](../tickets/authentication-workspaces-organization-isolation/003-recuperacao-senha-logout.md)
- [004 — Login Google e vínculo seguro de contas](../tickets/authentication-workspaces-organization-isolation/004-login-google-vinculo-seguro.md)
- [005 — Workspace padrão e contexto ativo](../tickets/authentication-workspaces-organization-isolation/005-workspace-padrao-contexto-ativo.md)
- [006 — Guard de Organization e isolamento multi-tenant](../tickets/authentication-workspaces-organization-isolation/006-guard-organization-isolamento-multitenant.md)
