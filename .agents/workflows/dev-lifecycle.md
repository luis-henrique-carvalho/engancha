---
name: dev-lifecycle
description: Ciclo de vida de desenvolvimento e matriz de skills (Descoberta, Design, Planejamento/Tickets, Implementação e Revisão)
---

# Workflow de Desenvolvimento & Matriz de Skills

Para novas funcionalidades, refatorações ou épicos, siga o fluxo orientado a skills estruturado nas 5 fases abaixo:

## Fase 1: Descoberta & Pesquisa
1. **Alinhamento de Requisitos**: Use `grill-me` se houver ambiguidades, trade-offs em aberto ou decisões de produto a tomar.
2. **Pesquisa Técnica**: Use `research` ao integrar bibliotecas desconhecidas, APIs externas ou specs complexas, registrando as descobertas.

## Fase 2: Design & Modelagem
3. **Modelo de Domínio**: Use `domain-modeling` para novos domínios, entidades e ADRs.
4. **Arquitetura de Módulos**: Use `codebase-design` para projetar *deep modules* e interfaces concisas com baixo acoplamento.
5. **Spikes / Prototipagem**: Use `prototype` se for necessário validar um fluxo de UI ou modelo de estado antes de codificar em definitivo.

## Fase 3: Planejamento & Tickets
6. **PRD & Tickets**: Use `prd-to-tickets` para conduzir o fluxo completo do Engancha: analisar contexto, resolver decisões materiais (DEC-XX), gerar a PRD em `docs/phases/` e decompor o trabalho em tickets verticais em `tickets/`.

## Fase 4: Implementação & Qualidade
7. **Execução de Tickets**: Implemente uma fatia vertical por vez usando `implement`.
8. **Estratégia de Testes**: Aplique `tdd` (ciclo red-green-refactor) para regras de negócio críticas, cálculos e serviços de domínio.
9. **Backend (NestJS)**: Aplique `nestjs-best-practices` em tickets da API e workers.
10. **Frontend (Web)**: Aplique `modern-web-guidance`, `vercel-react-best-practices` e `vercel-composition-patterns`.
11. **Refatoração Contínua**: Use `improve-codebase-architecture` quando o objetivo for simplificar dívida técnica ou desmembrar god nodes.

## Fase 5: Revisão & Finalização
12. **Revisão de Código**: Execute `code-review` ao concluir cada fatia vertical ou épico (avaliando *Standards* e *Spec*).
13. **Auditoria de UI/UX**: Use `web-design-guidelines` para acessibilidade e consistência visual.
14. **Documentação do Ticket**: Atualize a seção `Result` do ticket com o comportamento entregue e testes executados.
15. **Sincronização**: Execute `graphify update .`.
