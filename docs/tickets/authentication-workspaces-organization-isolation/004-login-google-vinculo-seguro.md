---
title: "Login Google e vínculo seguro de contas"
status: "in-progress"
type: "HITL"
parent: "docs/prds/authentication-workspaces-organization-isolation.md"
blocked_by:
  - "docs/tickets/authentication-workspaces-organization-isolation/002-confirmacao-email-entrega-resend-fila.md"
user_stories: [3]
---

## Parent

PRD `authentication-workspaces-organization-isolation`; cobre a User Story 3 e o requisito `FR-AUTH-003`.

## What to build

Configurar Google como social provider do Better Auth, com variáveis de ambiente validadas, callback coerente com a origem pública e retorno da web para sucesso, cancelamento ou falha. Exigir e-mail Google verificado para acesso ao produto e aplicar account linking seguro: Google é confiado explicitamente apenas após essa validação e contas com e-mails diferentes não são vinculadas.

Entregar o acionamento e os estados de OAuth na tela de login. A ausência de credenciais em ambiente local deve gerar configuração acionável e não quebrar o login por e-mail/senha. O ticket inclui revisão humana das URIs autorizadas, tela de consentimento e smoke test real no Google Cloud Console.

## Acceptance criteria

- [ ] As configurações Google exigidas são validadas apenas quando o provider estiver habilitado e não são expostas ao navegador.
- [ ] A URI de callback e as origens confiáveis correspondem ao ambiente configurado; o retorno do OAuth leva a um estado de sucesso, cancelamento ou falha compreensível.
- [ ] E-mail Google verificado pode criar ou acessar a conta; e-mail não verificado não recebe acesso ao produto.
- [ ] Account linking não aceita e-mails diferentes e não altera silenciosamente o e-mail/estado de verificação da conta local.
- [ ] Erros de account já vinculado, conta não vinculável e falha de callback são mapeados para mensagens seguras na web.
- [ ] Login por e-mail/senha continua funcional quando Google estiver ausente em desenvolvimento.
- [ ] Testes automatizados cobrem configuração, retorno de erro e regras de linking; smoke test manual com credenciais Google autorizadas confirma o callback real.

## Blocked by

`002-confirmacao-email-entrega-resend-fila`.

## Result

Implementado em `apps/api/src/auth/auth.ts` e na tela `apps/web/src/routes/auth.login.tsx`: provider só é habilitado com credenciais presentes, e-mail verificado é obrigatório e linking bloqueia e-mails diferentes. Para ativar em um ambiente, configurar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL` e `WEB_ORIGIN`; registrar no Google Cloud a redirect URI `${BETTER_AUTH_URL}/api/auth/callback/google` e a origem web em `trustedOrigins`. Testes automatizados de callback/linking e smoke no Google Cloud Console permanecem pendentes de credenciais e URIs autorizadas.
