---
title: "Recuperação de senha e logout"
status: "in-progress"
type: "AFK"
parent: "docs/prds/authentication-workspaces-organization-isolation.md"
blocked_by:
  - "docs/tickets/authentication-workspaces-organization-isolation/002-confirmacao-email-entrega-resend-fila.md"
user_stories: [4]
---

## Parent

PRD `authentication-workspaces-organization-isolation`; cobre a User Story 4 e os requisitos `FR-AUTH-005` e `FR-AUTH-006`.

## What to build

Entregar solicitação, entrega pela infraestrutura `email-delivery` e conclusão de recuperação de senha por Better Auth. A solicitação deve sempre produzir resposta segura, independente de o e-mail existir; os estados de token inválido ou expirado devem ser recuperáveis; e a senha substituta deve respeitar a política configurada.

Adicionar logout ao cliente e à API Better Auth, removendo a sessão atual e retornando a aplicação a um estado anônimo. Registrar explicitamente a política Better Auth aplicada a sessões após reset e cobri-la com testes, sem imprimir tokens, senhas ou dados de e-mail sensíveis.

## Acceptance criteria

- [ ] Uma solicitação de recuperação retorna mensagem neutra tanto para e-mail existente quanto inexistente.
- [ ] Better Auth produz o link de reset e a entrega usa o contrato e worker `email-delivery` já existentes.
- [ ] Um reset válido atualiza a senha dentro da política configurada e um token inválido ou expirado apresenta estado recuperável.
- [ ] A política de invalidação/revogação de sessões após reset é definida, implementada e testada.
- [ ] Logout invalida somente a sessão atual conforme o requisito e limpa o estado autenticado do cliente.
- [ ] As interfaces de solicitação, definição de nova senha e logout incluem loading, validação e mensagens acessíveis.
- [ ] Testes cobrem não enumeração de contas, sucesso, token inválido/expirado, troca de senha, política de sessão e logout.

## Blocked by

`002-confirmacao-email-entrega-resend-fila`.

## Result

Implementado no cliente Better Auth com telas de solicitação, reset, mensagens neutras, estados de erro e logout em `apps/web/src/routes/auth.*` e `apps/web/src/routes/workspace.tsx`. Reset expira em 1 hora e revoga sessões existentes (`revokeSessionsOnPasswordReset: true`). `tests/phase2-e2e.test.mjs` valida confirmação, reset por token, invalidação da sessão anterior e logout contra a API e infraestrutura local.
