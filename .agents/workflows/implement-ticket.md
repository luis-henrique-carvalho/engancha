---
name: implement-ticket
description: Sessão de implementação, testes, revisão e entrega de um ou múltiplos tickets
---

# Workflow: Implementação & Entrega de Tickets

> **Dica de Ouro**: Sempre inicie uma nova sessão de chat limpa ao começar um novo lote de tickets ou funcionalidade para evitar acúmulo de contexto e lentidão.

Este workflow é utilizado na **Sessão de Implementação** para executar um único ticket ou uma sequência de tickets em fatias verticais.

---

## 1. Ponto de Entrada
- Identifique o(s) ticket(s) fornecido(s) pelo usuário (ex: `/implement-ticket tickets/TICK-001.md` ou múltiplos tickets como `tickets/TICK-001.md tickets/TICK-002.md`).
- Se múltiplos tickets forem passados, processe-os sequencialmente em loop (um ticket por vez).

---

## 2. Ciclo de Execução (Por Ticket)

Para cada ticket da lista:

### A. Leitura do Ticket
- Leia o arquivo do ticket em `tickets/` para verificar escopo, arquivos afetados e critérios de aceite.

### B. Implementação com Testes & Padrões
1. **TDD**: Aplique a skill `tdd` (ciclo red-green-refactor) para regras de negócio críticas e serviços de domínio.
2. **Backend**: Aplique `nestjs-best-practices` em tickets da API (`apps/api`) e workers (`apps/worker`).
3. **Frontend**: Consulte a referência Shadcn (`apps/web/src/features/users`) e aplique `modern-web-guidance`, `vercel-react-best-practices` e `vercel-composition-patterns`.

### C. Revisão & Remediação
1. **Revisão de Código**: Execute `code-review` no diff contra a base.
2. **Auditoria UI/UX**: Se houver alteração de interface web, valide contra `web-design-guidelines`.
3. **Ajustes**: Corrija imediatamente qualquer problema apontado no review e garanta que os testes passem.

### D. Documentação do Ticket
- Atualize a seção `Result` no arquivo do próprio ticket com o resumo do que foi entregue e os testes executados.
- Avance para o próximo ticket da fila (se houver).

---

## 3. Finalização da Sessão (Sincronização Única)
- Após concluir todos os tickets do lote da sessão:
  - **Sincronização Única**: Execute `graphify update .` **apenas 1 vez** ao término da sessão inteira (não execute a cada micro-alteração de arquivo).
