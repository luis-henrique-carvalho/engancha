---
title: "Resposta de e-mail enriquece contato e cria primeiro lead"
status: "closed"
type: "AFK"
parent: "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md"
blocked_by:
  - "docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/002-execution-outputs-build-idempotent-ordered-history.md"
user_stories: [3, 4, 7]
---

## Parent

PRD `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/prd.md`; entrega o caminho principal de captura e conversão das User Stories 3, 4 e 7.

## What to build

Aceitar idempotentemente a resposta a uma captura pendente por `POST /api/v1/conversations/:id/email-captures/:captureId/responses`, enfileirar seu processamento e concluir a captura em uma transação autoritativa. O worker deve validar e normalizar o e-mail, acrescentar a mensagem de entrada, enriquecer o contato e criar seu primeiro lead com atribuição imutável à automação e execução originárias.

O contrato deriva workspace, provider, modo, automação e execução da captura autorizada. A execução original permanece concluída, enquanto a captura possui ciclo de vida independente.

## Acceptance criteria

- [x] O endpoint exige sessão, workspace ativo, ownership da conversa/captura e chave estável de idempotência, rejeitando contexto confiável enviado pelo browser.
- [x] Entrada inválida não cria mensagem, não altera contato ou lead e mantém a captura pendente para correção.
- [x] Uma resposta válida é persistida ou resolvida idempotentemente e publica um job versionado contendo somente identificadores seguros.
- [x] O worker reivindica a captura pendente, normaliza o e-mail e confirma mensagem, contato, lead e estado concluído numa única fronteira transacional.
- [x] O primeiro lead preserva `capturedAt`, automação, revisão e execução originárias; uma captura posterior compatível não duplica o lead nem reescreve sua atribuição.
- [x] A execução originária continua `COMPLETED` durante todo o ciclo da captura.
- [x] Contratos e projeções expõem estados seguros de pendente, processamento, concluído e validação, sem termos de fila ou worker.
- [x] Testes de contrato, PostgreSQL, worker e API E2E cobrem sucesso, entrada inválida, repetição, atribuição inicial e isolamento multi-tenant.
- [x] Typecheck, lint, formatter, migration e testes relevantes são executados e registrados em `Result`.

## Blocked by

- `docs/phases/phase-05-conversations-contacts-leads/008-conversations-contacts-leads/tickets/002-execution-outputs-build-idempotent-ordered-history.md`

## Result

Implementado e verificado:
- Model `Lead` criado no schema do Prisma e aplicado via migration `0007_lead_and_capture_response`.
- Endpoint seguro `POST /api/v1/conversations/:id/email-captures/:captureId/responses` criado com autorização do workspace ativo e validação de schemas Zod.
- Processador BullMQ `BullMqEmailCaptureProcessor` e serviço transacional `EmailCaptureService` / `PrismaEmailCaptureRepository` implementados para enriquecer contatos, criar mensagens `INBOUND` e gerar `Lead` com atribuição imutável (DEC-08).
- Idempotência ponta a ponta e execução originária mantida como `COMPLETED` durante o ciclo de vida independente da captura (DEC-04).
- Testes cobrindo fluxo ponta a ponta de enriquecimento e atribuição em `tests/contacts-conversations-execution.test.mjs` passando 100%.
- Verificação executada com sucesso: `npm run verify` (`npm run typecheck`, `npm test`, `npm run lint`, `npm run format:check`).

