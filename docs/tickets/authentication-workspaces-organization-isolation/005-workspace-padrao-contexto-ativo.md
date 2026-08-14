---
title: "Workspace padrão e contexto ativo"
status: "in-progress"
type: "AFK"
parent: "docs/prds/authentication-workspaces-organization-isolation.md"
blocked_by:
  - "docs/tickets/authentication-workspaces-organization-isolation/002-confirmacao-email-entrega-resend-fila.md"
user_stories: [5, 6]
---

## Parent

PRD `authentication-workspaces-organization-isolation`; cobre as User Stories 5 e 6 e os requisitos `FR-WORK-001`, `FR-WORK-002` e `FR-WORK-005`.

## What to build

Após o primeiro acesso autorizado de um usuário confirmado, garantir uma Organization padrão por meio do Organization Plugin, com membership `owner`, nome/slug válidos e Organization definida explicitamente como ativa na sessão. A criação deve ser idempotente mesmo diante de callbacks ou requisições concorrentes.

Expor um contexto seguro de workspace ativo ao frontend, sempre derivado da sessão e membership no servidor. A aplicação deve exibir o nome do workspace no layout e tratar carregamento, contexto ausente/obsoleto e retry de forma recuperável. O controle visual comunica o workspace atual, mas não implementa alternância entre múltiplas Organizations.

## Acceptance criteria

- [x] O bootstrap ocorre somente para sessão válida e e-mail confirmado; identidades pendentes não criam Organization.
- [x] O primeiro acesso cria uma única Organization padrão e membership `owner` com nome e slug válidos.
- [ ] Tentativas concorrentes ou repetidas retornam/reutilizam o mesmo workspace e não deixam Organizations ou memberships duplicados.
- [x] A Organization resultante é definida explicitamente como ativa na sessão Better Auth.
- [x] O endpoint/contexto de workspace retorna somente a Organization ativa cuja membership do usuário continua válida.
- [x] O layout mostra o nome do workspace e oferece estados acessíveis de carregamento, ausência, erro e recuperação.
- [x] O seletor é somente informativo no MVP de workspace único, mantendo extensão futura para troca pelo Organization Plugin.
- [ ] Testes de integração cobrem criação, owner membership, sessão ativa, idempotência concorrente e recuperação de contexto inválido.

## Blocked by

`002-confirmacao-email-entrega-resend-fila`.

## Result

Implementado em `apps/api/src/workspaces` com `POST /api/v1/workspaces/bootstrap`, `GET /api/v1/workspaces/active` e `GET /api/v1/workspaces/:id`; bootstrap cria/reutiliza Organization, membership owner e atualiza `activeOrganizationId`. A web exibe o workspace e retry. Smoke local confirmou cadastro verificado, sessão, bootstrap 201 e contexto ativo 200. Teste concorrente formal permanece pendente.
