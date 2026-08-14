---
title: "Cadastro e sessão e-mail/senha com Prisma e Better Auth"
status: "needs-triage"
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

- [ ] Prisma está configurado para PostgreSQL e o cliente é gerado de modo compatível com as versões fixadas do projeto.
- [ ] A instância do Better Auth usa o adapter Prisma e o Organization Plugin; `user`, `session`, `account`, `verification`, `organization`, `member` e `invitation` são gerados sem duplicar entidades de domínio.
- [ ] O schema é produzido pelo CLI do Better Auth e persistido por uma migration Prisma reprodutível; comandos de migration do Better Auth não são usados com o adapter Prisma.
- [ ] Better Auth é integrado à API Nest sem quebrar health checks nem o prefixo versionado das APIs de produto.
- [ ] Um visitante pode cadastrar nome, e-mail válido e senha válida; uma nova tentativa não cria segunda conta para o mesmo e-mail normalizado.
- [ ] Um usuário pode entrar por e-mail/senha e recebe uma sessão em cookie HTTP-only; credenciais inválidas retornam uma mensagem que não revela a existência do e-mail.
- [ ] A web entrega telas de cadastro e login com loading, sucesso e erro acessíveis, usando o cliente Better Auth e sem persistir segredos no navegador.
- [ ] Testes de integração comprovam schema/migration, cadastro, login, atributos de cookie e manutenção das rotas públicas necessárias.

## Blocked by

None - can start immediately.

## Result

Preencher durante a implementação com comportamento entregue, schema/migration, contratos principais, decisões e validações executadas.
