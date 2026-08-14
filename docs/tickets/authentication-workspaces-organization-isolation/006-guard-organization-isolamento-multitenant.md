---
title: "Guard de Organization e isolamento multi-tenant"
status: "in-progress"
type: "AFK"
parent: "docs/prds/authentication-workspaces-organization-isolation.md"
blocked_by:
  - "docs/tickets/authentication-workspaces-organization-isolation/005-workspace-padrao-contexto-ativo.md"
user_stories: [7, 8]
---

## Parent

PRD `authentication-workspaces-organization-isolation`; cobre as User Stories 7 e 8, `FR-WORK-004`, `RN-001` e `RN-008`.

## What to build

Criar a resolução de contexto autenticado reutilizável para rotas de produto: sessão válida, usuário confirmado, `activeOrganizationId` e membership atual. Disponibilizar guard/decorator ou fronteira equivalente para que casos de uso e futuros repositories recebam esse contexto resolvido pelo servidor, nunca um tenant decidido pelo DTO do cliente.

Entregar um endpoint ou recurso protegido mínimo que comprove a fronteira: um membro acessa apenas seu contexto ativo; falta de sessão recebe `401`; Organization ativa ausente ou membership inválido não permite a operação; e recurso pertencente a outra Organization responde `404`, sem revelar a sua existência. Preservar apenas IDs não sensíveis nos logs estruturados necessários para diagnóstico.

## Acceptance criteria

- [x] Uma abstração reutilizável resolve `userId`, `organizationId` ativo e membership a partir da sessão no limite da API.
- [ ] Rotas públicas de Better Auth e health checks continuam acessíveis sem o guard de produto.
- [ ] Rotas de produto exigem usuário confirmado, sessão válida, Organization ativa e membership atual.
- [ ] Um `organizationId` enviado pelo cliente não substitui nem amplia o contexto resolvido no servidor.
- [ ] O recurso protegido de prova sempre usa o `organizationId` do contexto em leituras e escritas.
- [ ] Sessão ausente/inválida retorna `401`; recurso de outra Organization retorna `404`; membership ou contexto ativo inválido não concede acesso.
- [ ] Logs correlacionáveis podem registrar `userId` e `organizationId`, mas excluem cookies, tokens OAuth, tokens de verificação/reset, senhas e segredos.
- [ ] Testes E2E/API simulam pelo menos dois usuários/Organizations e comprovam tentativas por ID adivinhado, Organization enviada pelo cliente, membership removido e contexto ativo ausente.

## Blocked by

`005-workspace-padrao-contexto-ativo`.

## Result

Implementado em `apps/api/src/authorization/authorization-context.ts` e integrado ao módulo de workspaces. O guard deriva contexto da sessão, exige e-mail confirmado/membership e retorna as políticas `401`, `403`, `409` e `404`; `GET /api/v1/workspaces/:id` não aceita tenant arbitrário. Além dos testes unitários, `tests/phase2-e2e.test.mjs` cria dois usuários e duas Organizations, bloqueia leitura/troca por ID alheio e confirma que uma membership removida invalida o contexto ativo.
