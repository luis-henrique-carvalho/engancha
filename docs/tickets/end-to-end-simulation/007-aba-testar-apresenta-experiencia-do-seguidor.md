---
title: "Aba Testar apresenta experiência do seguidor"
status: "needs-triage"
type: "HITL"
parent: "docs/prds/end-to-end-simulation.md"
blocked_by:
  - "docs/tickets/end-to-end-simulation/003-jornada-simulada-com-resposta-dm-e-link.md"
  - "docs/tickets/end-to-end-simulation/004-captura-email-termina-em-solicitacao-simulada.md"
  - "docs/tickets/end-to-end-simulation/006-execucao-atualiza-por-sse-com-recuperacao-http.md"
user_stories: [1, 3, 4, 5]
---

## Parent

PRD `docs/prds/end-to-end-simulation.md`; cobre a experiência de `FR-SIM-001`, `FR-SIM-003` a `FR-SIM-007` e as User Stories 1, 3, 4 e 5.

## What to build

Transformar o detalhe da automação nas áreas `Configuração`, `Testar` e `Atividade` e entregar a área `Testar` como jornada do seguidor. O usuário visualiza o conteúdo publicado, seleciona Instagram, escreve o comentário e acompanha por HTTP/SSE comentário, resposta pública, DM e ação final, com estados compreensíveis e sem linguagem de infraestrutura.

## Acceptance criteria

- [ ] A navegação do detalhe expõe `Configuração`, `Testar` e `Atividade` de forma responsiva, acessível e compatível com o editor existente.
- [ ] `Testar` usa o conteúdo da revisão publicada ativa, oferece apenas Instagram e não apresenta nem envia campo de modo.
- [ ] Draft ou automação pausada não inicia teste e mostra orientação clara para configurar/publicar/reativar.
- [ ] O formulário coleta autor, texto obrigatório e identificador opcional, gera uma chave idempotente por submissão e trata validação/erro sem perder a entrada.
- [ ] Após o POST, a UI carrega por GET, acompanha por SSE e apresenta progressivamente comentário, resposta pública, DM e ação final.
- [ ] Link e solicitação de e-mail têm finais visuais distintos; a captura deixa claro que nenhum dado real foi coletado.
- [ ] Estados vazio, enviando, processando, reconectando, ignorado, falho e concluído são acessíveis e preservam a identificação de simulação.
- [ ] Nenhum texto de produto menciona job, worker, Redis, fila, stack trace ou payload técnico.
- [ ] Testes DOM/browser cobrem os dois caminhos positivos, no-match, falha, reconexão, idempotência de submissão, teclado e anúncios de estado.
- [ ] A hierarquia visual, a linguagem e a responsividade recebem revisão humana antes do fechamento do ticket.

## Blocked by

- `docs/tickets/end-to-end-simulation/003-jornada-simulada-com-resposta-dm-e-link.md`
- `docs/tickets/end-to-end-simulation/004-captura-email-termina-em-solicitacao-simulada.md`
- `docs/tickets/end-to-end-simulation/006-execucao-atualiza-por-sse-com-recuperacao-http.md`

## Result

Preencher durante a implementação com comportamento entregue, evidências visuais, contratos/hooks, arquivos principais, revisão humana e validações executadas.
