---
title: "Monorepo executável e shell web"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/local-executable-monorepo-foundation.md"
blocked_by: []
user_stories: [1, 4]
---

## Parent

PRD `local-executable-monorepo-foundation`; cobre as User Stories 1 e 4 e os critérios de aceite do workspace, aplicações, pacote compartilhado e inicialização documentada.

## What to build

Criar o workspace npm com `apps/web`, `apps/api`, `apps/worker` e `packages/contracts`, configuração compartilhada de TypeScript, lint e formatação, scripts independentes de execução e um shell mínimo do frontend TanStack Start que confirme a disponibilidade do ambiente sem depender da API ou do worker.

## Acceptance criteria

- [ ] O workspace instala e reconhece os quatro pacotes previstos, com fronteiras de dependência explícitas.
- [ ] Web, API e worker possuem comandos independentes de desenvolvimento e execução.
- [ ] A aplicação web inicia e renderiza uma superfície mínima sem importar módulos internos da API ou do worker.
- [ ] `.env.example` e instruções básicas de instalação e inicialização são incluídos.
- [ ] Testes ou validações automatizadas cobrem a configuração do workspace e a inicialização mínima do web.

## Blocked by

None - can start immediately.

## Result

Preencher durante a implementação com comportamento entregue, contratos, arquivos principais, decisões e validações executadas.
