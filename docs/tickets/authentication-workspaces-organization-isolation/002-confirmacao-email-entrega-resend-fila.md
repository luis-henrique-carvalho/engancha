---
title: "Confirmação de e-mail e entrega Resend por fila"
status: "needs-triage"
type: "HITL"
parent: "docs/prds/authentication-workspaces-organization-isolation.md"
blocked_by:
  - "docs/tickets/authentication-workspaces-organization-isolation/001-cadastro-sessao-email-senha-prisma-better-auth.md"
user_stories: [1, 2, 3]
---

## Parent

PRD `authentication-workspaces-organization-isolation`; cobre as User Stories 1, 2 e 3 e os requisitos `FR-AUTH-001`, `FR-AUTH-002` e `FR-AUTH-004`.

## What to build

Configurar a verificação obrigatória de e-mail do Better Auth e sua callback de envio para produzir jobs versionados na fila `email-delivery`. Implementar no worker o processor que valida o job e envia mensagens transacionais por um adapter Resend, com retry, falha permanente observável e logs sem URLs/tokens/segredos.

Entregar o fluxo web de cadastro pendente, confirmação por link, estado de link inválido ou expirado e reenvio de confirmação limitado. Enquanto `emailVerified` não for verdadeiro, login e rotas de produto devem permanecer bloqueados; o erro de login deve orientar para o reenvio sem revelar informações adicionais. A implementação deve usar origem confiável explícita, políticas de cookie seguras e rate limits apropriados para as rotas de autenticação.

## Acceptance criteria

- [ ] O cadastro cria uma identidade pendente e agenda uma mensagem de confirmação sem aguardar o provedor de e-mail na requisição HTTP.
- [ ] O contrato de `email-delivery` é versionado, validado pela API e novamente pelo worker antes do envio.
- [ ] O adapter Resend envia confirmação a partir de configuração validada; retries transitórios e falhas definitivas seguem a política declarada da fila.
- [ ] Um link de confirmação válido marca o e-mail como verificado; links inválidos, expirados ou já usados retornam estado recuperável.
- [ ] Usuário não confirmado não ganha sessão de produto; login não confirmado oferece reenvio limitado e resposta segura.
- [ ] A web apresenta estados acessíveis de confirmação pendente, sucesso, link inválido/expirado, reenvio e rate limit.
- [ ] `trustedOrigins`, cookies de produção e regras de rate limit do Better Auth são configurados e cobertos por testes relevantes.
- [ ] Testes de API/worker cobrem enfileiramento, envio bem-sucedido, retry, falha permanente, proteção de logs e bloqueio de acesso não confirmado.
- [ ] Um smoke test manual com domínio/remetente e credenciais Resend autorizados confirma a entrega real sem expor segredos em saída ou documentação.

## Blocked by

`001-cadastro-sessao-email-senha-prisma-better-auth`.

## Result

Preencher durante a implementação com comportamento entregue, configuração externa validada, contratos, arquivos principais e validações executadas.
