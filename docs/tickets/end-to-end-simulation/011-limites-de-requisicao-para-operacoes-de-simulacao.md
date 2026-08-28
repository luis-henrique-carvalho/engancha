---
title: "Limites de requisição para operações de simulação"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/end-to-end-simulation.md"
blocked_by: []
user_stories: [1, 5, 7, 9]
---

## Parent

PRD `docs/prds/end-to-end-simulation.md`; fecha o requisito de qualidade que protege os endpoints de simulação sem alterar o fluxo determinístico de idempotência, retry ou reconexão.

## What to build

Aplicar limites de requisição explícitos às operações HTTP de simulação. Um membro autenticado deve poder testar e recuperar execuções normalmente, mas solicitações repetidas ou abusivas devem receber uma resposta estável e segura antes de criar carga desproporcional no PostgreSQL, BullMQ ou worker.

O slice abrange `POST /simulations/comments`, `POST /simulations/executions/:id/retry` e `GET /simulations/executions` (incluindo consultas individuais quando a política compartilhada exigir). Os limites devem usar uma chave de escopo segura derivada da sessão e do workspace ativo, ter valores configuráveis por ambiente e manter a semântica da chave de idempotência: uma repetição válida não pode criar outra execução, e o bloqueio não pode expor IDs, payloads ou dados de outro workspace.

## Acceptance criteria

- [ ] Os endpoints de criação, retry e consulta de simulações têm política de rate limit explícita, configurável e documentada, aplicada depois da autenticação e do contexto do workspace.
- [ ] A chave de limitação diferencia adequadamente membros ou sessões e o workspace ativo, sem aceitar identificadores enviados pelo browser como evidência de autorização.
- [ ] Ao exceder o limite, a API retorna `429 Too Many Requests` com código e mensagem seguros, sem criar execução, enfileirar job ou alterar o estado de retry.
- [ ] Uma submissão idempotente dentro do limite preserva o `executionId` existente e não cria um novo ciclo lógico de enfileiramento.
- [ ] As políticas não bloqueiam a reconciliação HTTP necessária após uma desconexão SSE dentro do uso normal previsto.
- [ ] Testes E2E cobrem o limite, a recuperação após a janela, isolamento entre workspaces e a ausência de efeitos persistentes ou de fila após uma rejeição.
- [ ] Typecheck, lint, formatter e testes relevantes são executados e registrados em `Result`.
- [ ] A seção `Result` documenta o comportamento entregue, os principais arquivos ou contratos, decisões e limites relevantes e as validações executadas.

## Blocked by

None - can start immediately.
