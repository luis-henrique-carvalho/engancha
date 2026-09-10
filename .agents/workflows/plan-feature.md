---
name: plan-feature
description: Sessão de planejamento, descoberta, arquitetura e geração de PRD e tickets Markdown
---

# Workflow: Planejamento de Feature & Especificação

Use este workflow para a **Sessão de Planejamento** ao iniciar uma nova funcionalidade, épico ou grande refatoração. O objetivo desta sessão é sair de uma ideia/requisito e produzir artefatos persistentes no repositório (PRD e tickets verticais).

---

## Fase 1: Descoberta & Pesquisa
1. **Alinhamento de Requisitos**: Use a skill `grill-me` se houver ambiguidades, trade-offs em aberto ou decisões de produto a tomar antes de bater o martelo.
2. **Pesquisa Técnica**: Use a skill `research` ao integrar bibliotecas desconhecidas, APIs externas ou specs complexas, documentando as descobertas.

## Fase 2: Design & Modelagem
3. **Modelo de Domínio**: Use a skill `domain-modeling` para desenhar novos domínios, entidades, limites de agregados e registrar ADRs necessários.
4. **Arquitetura de Módulos**: Use a skill `codebase-design` para projetar *deep modules* e interfaces concisas com baixo acoplamento.
5. **Spikes / Prototipagem**: Use a skill `prototype` apenas se for estritamente necessário validar um fluxo de UI complexo ou modelo de estado antes da especificação definitiva.

## Fase 3: Planejamento, PRD & Tickets
6. **PRD & Fatiamento em Tickets**: Use a skill `prd-to-tickets` para:
   - Analisar o contexto e resolver decisões materiais pendentes (`DEC-XX`).
   - Gerar o documento de PRD em `docs/phases/`.
   - Decompor a entrega em fatias verticais (*tracer-bullet*) e gerar os tickets Markdown em `tickets/` (ou `docs/tickets/`).

---

🏁 **Ponto de Parada da Sessão**:
Ao término da Fase 3, a sessão de planejamento está concluída. Os tickets e a PRD estão persistidos no disco e prontos para serem implementados em sessões dedicadas via `/implement-ticket`.
