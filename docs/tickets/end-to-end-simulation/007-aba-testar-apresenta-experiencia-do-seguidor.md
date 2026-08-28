---
title: "Aba Testar apresenta experiência do seguidor"
status: "completed"
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

- [x] A navegação do detalhe expõe `Configuração`, `Testar` e `Atividade` de forma responsiva, acessível e compatível com o editor existente.
- [x] `Testar` usa o conteúdo da revisão publicada ativa, oferece apenas Instagram e não apresenta nem envia campo de modo.
- [x] Draft ou automação pausada não inicia teste e mostra orientação clara para configurar/publicar/reativar.
- [x] O formulário coleta autor, texto obrigatório e identificador opcional, gera uma chave idempotente por submissão e trata validação/erro sem perder a entrada.
- [x] Após o POST, a UI carrega por GET, acompanha por SSE e apresenta progressivamente comentário, resposta pública, DM e ação final.
- [x] Link e solicitação de e-mail têm finais visuais distintos; a captura deixa claro que nenhum dado real foi coletado.
- [x] Estados vazio, enviando, processando, reconectando, ignorado, falho e concluído são acessíveis e preservam a identificação de simulação.
- [x] Nenhum texto de produto menciona job, worker, Redis, fila, stack trace ou payload técnico.
- [x] Testes DOM/browser cobrem os dois caminhos positivos, no-match, falha, reconexão, idempotência de submissão, teclado e anúncios de estado.
- [x] A hierarquia visual, a linguagem e a responsividade recebem revisão humana antes do fechamento do ticket.

## Blocked by

- `docs/tickets/end-to-end-simulation/003-jornada-simulada-com-resposta-dm-e-link.md`
- `docs/tickets/end-to-end-simulation/004-captura-email-termina-em-solicitacao-simulada.md`
- `docs/tickets/end-to-end-simulation/006-execucao-atualiza-por-sse-com-recuperacao-http.md`

## Result

Entregue a aba **Testar** e a navegação do detalhe da automação nas áreas `Configuração`, `Testar` e `Atividade`:

- **Navegação do Detalhe (`AutomationEditorLayoutView`)**:
  - Sub-navegação em abas com `Configuração` (`/automations/:id/...`), `Testar` (`/automations/:id/test`) e `Atividade` (`/automations/:id/activity`), preservando o editor em 7 etapas quando na aba de configuração e renderizando visualizações dedicadas nas outras abas.
  - Acessibilidade com `role="tablist"`, `role="tab"`, `aria-selected` e atalhos de navegação.

- **Aba Testar (`AutomationTestTabView`)**:
  - Validação de estado da automação: rascunhos (`DRAFT`) ou automações pausadas (`PAUSED`) exibem cartões de orientação com botão direto para configurar, publicar ou reativar.
  - Utilização do conteúdo publicado ativo da automação (`automation.published.target`) com pré-visualização (título, tipo Post/Reel, badge de Simulado).
  - Provedor estritamente fixado em `INSTAGRAM` sem exibição ou envio do campo `mode` (garantindo enforcement de `mode=SIMULATED` no backend).

- **Formulário de Simulação (`SimulationTestForm`)**:
  - Coleta de autor (obrigatório, max 120 chars), identificador opcional de comentário e texto do comentário (obrigatório, max 1000 chars).
  - Geração automática de chave de idempotência (`crypto.randomUUID()`) por submissão.
  - Validação de entrada sem perda de dados digitados em caso de erro.

- **Jornada do Seguidor (`SimulationFollowerChat`)**:
  - Renderização progressiva da experiência simulada:
    1. **Comentário publicado** pelo seguidor com identificação e avatar.
    2. **Resposta pública** no Instagram com badge e mensagem da conta.
    3. **Mensagem direta (DM)** com balão de direct.
    4. **Ação final**:
       - *Entrega de link*: card com botão de destino e URL configurada.
       - *Captura de e-mail*: prompt configurado com aviso explícito de simulação (*"Simulação: a jornada encerra na solicitação. Nenhum dado real foi coletado"*).
  - Estados de interface com linguagem amigável: Vazio, Enviando, Processando (*"Analisando comentário e preparando respostas..."*), Reconectando SSE, Ignorado (*"Nenhuma automação ativa reconheceu a palavra-chave configurada para esta publicação"*), Falhou (com mensagem segura e botão de repetição) e Concluído.
  - Ausência total de termos técnicos (job, worker, Redis, fila, stack trace).
  - Acessibilidade com `aria-live="polite"` e `role="status"`.

- **Serviços e Hooks**:
  - `SimulationsApi` (`apps/web/src/features/automations/services/simulations-api.ts`): endpoints `POST /simulations/comments`, `GET /simulations/executions/:id`, `POST /simulations/executions/:id/retry` e URL de stream SSE.
  - `useSimulationExecution` (`apps/web/src/features/automations/hooks/use-simulation-execution.ts`): gerenciamento de estado da execução com reconciliação HTTP e stream SSE em tempo real, reconexão resiliente e idempotência.
  - `simulation-view-mappers` (`apps/web/src/features/automations/data/simulation-view-mappers.ts`): extração de saídas e mapeamento seguro de status.

- **Validações e Testes**:
  - `npm run verify` passou com 100% de sucesso (Typecheck, Vitest, Lint e Prettier).
  - 36 arquivos de teste e 210 testes no navegador/Vitest passando.
  - Testes unitários e de componente cobrindo: caminhos positivos (Link e Captura de e-mail), comentário ignorado, falha com retry, reconexão SSE, validação de formulário, geração de UUID idempotente e navegação entre abas.
