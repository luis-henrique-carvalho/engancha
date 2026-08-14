---
title: "Cadastro e sessão e-mail/senha com Prisma e Better Auth"
status: "in-progress"
type: "AFK"
parent: "docs/prds/authentication-workspaces-organization-isolation.md"
blocked_by: []
user_stories: [1, 3]
---

## Parent

PRD `authentication-workspaces-organization-isolation`; cobre as User Stories 1 e 3, os requisitos `FR-AUTH-001` e `FR-AUTH-002`, e estabelece a persistência inicial necessária para toda a Fase 2.

## What to build

Inicializar Prisma para PostgreSQL na API e configurar Better Auth com o adapter Prisma e Organization Plugin. Após a instância e seus plugins estarem definidos, gerar o schema do Better Auth, criar uma migration Prisma versionada e disponibilizar as rotas Better Auth sob `/api/auth/*` pela integração NestJS compatível.

Entregar também o fluxo web/API de cadastro e entrada por e-mail/senha: nome obrigatório, e-mail normalizado, política de senha do Better Auth, erros seguros e sessão baseada em cookie HTTP-only. O app Nest deve permitir que Better Auth processe o corpo das requisições, manter health checks públicos e preservar a fronteira `/api/v1/*` para APIs de produto futuras. A interface deve exibir estados de envio, sucesso, erro seguro e sessão em carregamento, sem salvar tokens ou credenciais no browser.

## Acceptance criteria

- [x] Prisma está configurado para PostgreSQL e o cliente é gerado de modo compatível com as versões fixadas do projeto.
- [x] A instância do Better Auth usa o adapter Prisma e o Organization Plugin; `user`, `session`, `account`, `verification`, `organization`, `member` e `invitation` são gerados sem duplicar entidades de domínio.
- [x] O schema é persistido por uma migration Prisma reprodutível; o CLI do Better Auth foi executado em arquivo temporário para validar a configuração e não foi usado para aplicar migration Prisma.
- [x] Better Auth é integrado à API Nest sem quebrar health checks nem o prefixo versionado das APIs de produto.
- [x] Um visitante pode cadastrar nome, e-mail válido e senha válida; uma nova tentativa não cria segunda conta para o mesmo e-mail normalizado.
- [x] Um usuário pode entrar por e-mail/senha e recebe uma sessão em cookie HTTP-only; credenciais inválidas retornam uma mensagem que não revela a existência do e-mail.
- [x] A web entrega telas de cadastro e login com loading, sucesso e erro acessíveis, usando o cliente Better Auth e sem persistir segredos no navegador.
- [x] Testes automatizados, build e smoke test local cobrem schema/migration, cadastro, login, cookie e rotas públicas necessárias.

## Blocked by

None - can start immediately.

## Result

Implementado em `apps/api/src/auth`, `apps/api/src/database`, `prisma/` e nas rotas web de autenticação. Better Auth 1.6.28 usa Prisma 7.9.1/adapter pg, Organization Plugin, cookies HTTP-only, e-mail confirmado e integração Nest com body parser desativado. Migration `0001_better_auth_foundation` aplicada em PostgreSQL local. Validações: `npm run typecheck`, `npm test` (34 testes), builds API/worker/web e smoke de cadastro, login, cookie, liveness e bloqueio de bootstrap não autenticado.
