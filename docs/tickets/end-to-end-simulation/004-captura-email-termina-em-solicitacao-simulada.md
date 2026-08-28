---
title: "Captura de e-mail termina em solicitação simulada"
status: "completed"
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

- [x] O worker reconhece a ação final `CAPTURE_EMAIL`, valida seu payload e persiste uma saída determinística de solicitação de e-mail na ordem publicada.
- [x] A execução termina em `COMPLETED` com resposta pública, DM e prompt de captura consultáveis.
- [x] A projeção deixa claro que a captura é simulada e que nenhum endereço foi coletado.
- [x] O fluxo não aceita e-mail como continuação e não cria `Conversation`, `Message`, `Contact`, `Lead`, `Tag` ou `ContactTag`.
- [x] Retry/redelivery não duplica o prompt nem as saídas anteriores.
- [x] Testes unitários, Prisma, worker, API e E2E cobrem sucesso, payload inválido, ordenação, idempotência e a fronteira explícita com a Fase 5.

## Blocked by

- `docs/tickets/end-to-end-simulation/003-jornada-simulada-com-resposta-dm-e-link.md`

## Result

Entregue o suporte à ação final `CAPTURE_EMAIL` gerando solicitação simulada com fronteira estrita em relação à Fase 5:

- **Contratos e Domínio (`@engancha/contracts`)**:
  - `executionOutputTypeSchema` inclui `EMAIL_CAPTURE_REQUEST`.
  - `getChannelCapabilities()` inclui suporte à `CAPTURE_EMAIL` no Instagram simulado.
- **Worker (`@engancha/worker`)**:
  - Reconhecimento da ação terminal `CAPTURE_EMAIL`, normalização para a saída `EMAIL_CAPTURE_REQUEST` com payload `{ prompt, simulated: true }`.
  - Chave determinística `${executionId}:${position}:EMAIL_CAPTURE_REQUEST` e `upsert` idempotente via transação Prisma.
  - Conclusão em `COMPLETED` preservando isolamento: nenhuma entidade externa de conversa, mensagem, contato ou lead é criada.
- **API (`@engancha/api`)**:
  - Projeção serializada de `outputs` expondo `EMAIL_CAPTURE_REQUEST` com seu `prompt` e marcação `simulated: true`.
- **Validações e Testes**:
  - `npm run typecheck` — passou sem erros.
  - `npm run lint` — passou sem erros.
  - `npm run test:simulations:e2e` — teste E2E dedicado validando criação, publicação de automação com `CAPTURE_EMAIL`, consumo pelo worker, saída `EMAIL_CAPTURE_REQUEST`, conclusão em `COMPLETED` e validação de banco confirmando integridade e isolamento (`channelConnectionId: null`, `mode: SIMULATED`).
