---
title: "Runtime Nest, configuração e operação"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/local-executable-monorepo-foundation.md"
blocked_by:
  - "docs/tickets/local-executable-monorepo-foundation/001-monorepo-executavel-e-shell-web.md"
user_stories: [1, 2]
---

## Parent

PRD `local-executable-monorepo-foundation`; cobre as User Stories 1 e 2 e os critérios de aceite de API/worker NestJS, configuração, prefixo, erros, logs e encerramento ordenado.

## What to build

Inicializar API e worker como processos NestJS independentes, com configuração validada na inicialização, prefixo público `/api/v1` na API, tratamento global de erros, logs estruturados sem segredos e graceful shutdown para interromper novas operações e fechar conexões de forma ordenada.

## Acceptance criteria

- [ ] API e worker iniciam como processos independentes e falham com mensagem acionável quando a configuração obrigatória é inválida.
- [ ] A API aplica o prefixo `/api/v1` aos endpoints públicos da aplicação.
- [ ] Erros não tratados são convertidos em respostas/logs estruturados sem expor credenciais ou URLs sensíveis.
- [ ] API e worker registram inicialização, prontidão e encerramento de forma correlacionável.
- [ ] Testes cobrem validação de ambiente, prefixo, tratamento de erro e graceful shutdown.

## Blocked by

`docs/tickets/local-executable-monorepo-foundation/001-monorepo-executavel-e-shell-web.md`

## Result

Preencher durante a implementação com comportamento entregue, contratos, arquivos principais, decisões e validações executadas.
