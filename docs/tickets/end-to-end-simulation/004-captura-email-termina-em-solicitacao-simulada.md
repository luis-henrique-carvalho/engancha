---
title: "Captura de e-mail termina em solicitação simulada"
status: "needs-triage"
type: "AFK"
parent: "docs/prds/end-to-end-simulation.md"
blocked_by: ["docs/tickets/end-to-end-simulation/003-jornada-simulada-com-resposta-dm-e-link.md"]
user_stories: [3]
---

## Parent

PRD `docs/prds/end-to-end-simulation.md`; cobre `FR-SIM-006`, amplia `FR-SIM-007` e atende à User Story 3 sem antecipar `FR-DATA-001` a `FR-DATA-006`.

## What to build

Adicionar o segundo caminho positivo da ação final: uma revisão `CAPTURE_EMAIL` deve persistir e apresentar a solicitação configurada ao seguidor depois da resposta pública e da DM. O fluxo termina na pergunta; não recebe e-mail nem cria entidades de conversa, contato ou lead.

## Acceptance criteria

- [ ] O worker reconhece a ação final `CAPTURE_EMAIL`, valida seu payload e persiste uma saída determinística de solicitação de e-mail na ordem publicada.
- [ ] A execução termina em `COMPLETED` com resposta pública, DM e prompt de captura consultáveis.
- [ ] A projeção deixa claro que a captura é simulada e que nenhum endereço foi coletado.
- [ ] O fluxo não aceita e-mail como continuação e não cria `Conversation`, `Message`, `Contact`, `Lead`, `Tag` ou `ContactTag`.
- [ ] Retry/redelivery não duplica o prompt nem as saídas anteriores.
- [ ] Testes unitários, Prisma, worker, API e E2E cobrem sucesso, payload inválido, ordenação, idempotência e a fronteira explícita com a Fase 5.

## Blocked by

- `docs/tickets/end-to-end-simulation/003-jornada-simulada-com-resposta-dm-e-link.md`

## Result

Preencher durante a implementação com comportamento entregue, contrato do prompt, arquivos principais, decisões e validações executadas.
