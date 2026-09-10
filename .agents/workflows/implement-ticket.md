---
name: implement-ticket
description: Sessão de implementação, testes, revisão e entrega de um ou múltiplos tickets
---

# Workflow: Implementação & Entrega de Tickets

Use este workflow para a **Sessão de Implementação**. Ele foi projetado para implementar **um único ticket ou uma sequência de tickets** (lote do mesmo épico/funcionalidade) em fatias verticais ordenadas.

---

## 1. Ponto de Entrada & Planejamento da Sessão
- Identifique o(s) ticket(s) fornecido(s) pelo usuário (ex: `tickets/TICK-001.md` ou uma lista como `tickets/TICK-001.md tickets/TICK-002.md`).
- Se múltiplos tickets forem fornecidos, ordene-os por dependência lógica e processe-os sequencialmente em loop (um ticket por vez).

---

## 2. Ciclo de Execução (Por Ticket)

Para cada ticket da fila, execute o ciclo completo antes de avançar para o próximo:

### A. Leitura & Escopo
- Leia o arquivo do ticket atual para absorver critérios de aceite, regras de negócio e arquivos impactados.

### B. Implementação com TDD & Padrões
1. **TDD First**:
   - Aplique a skill `tdd` (ciclo red-green-refactor) para regras de negócio críticas, agregados, validações e serviços de domínio.
2. **Backend (NestJS)**:
   - Aplique a skill `nestjs-best-practices` em tickets da API (`apps/api`) e dos workers (`apps/worker`).
3. **Frontend (Web)**:
   - Consulte o grafo de referência do Shadcn Admin antes de criar/alterar UI:
     `cd "$reference_dir" && graphify query "<padrão visual ou de interação>"`
   - Siga a convenção canônica de `apps/web/src/features/users` (`views/`, `components/`, `hooks/`, `services/`).
   - Aplique as skills `modern-web-guidance`, `vercel-react-best-practices` e `vercel-composition-patterns`.
4. **Arquitetura Limpa**:
   - Use `improve-codebase-architecture` caso identifique oportunidade de simplificar dívida técnica ou desmembrar god nodes tocados pelo ticket.

### C. Revisão & Remediação
1. **Revisão de Código**:
   - Execute a skill `code-review` no diff deste ticket contra a base (avaliando *Standards* e *Spec*).
2. **Auditoria de UI/UX (se aplicável)**:
   - Se houver interface web modificada, valide contra `web-design-guidelines`.
3. **Ajustes & Remediação Imediata**:
   - Se houver apontamentos de padrões ou divergências de spec, corrija imediatamente e revalide a suíte de testes do ticket.

### D. Documentação do Ticket
- Abra o arquivo do ticket em `tickets/` e preencha/atualize a seção `Result`:
  - Resumo das mudanças implementadas.
  - Testes executados e status de aprovação.
  - Decisões técnicas ou desvios em relação à spec original.
- Se houver mais tickets na fila da sessão, avance para o próximo ticket e repita o ciclo (A → B → C → D).

---

## 3. Finalização da Sessão (Pós-Lote)
Quando todos os tickets da sessão forem concluídos:
1. **Validação Global**: Execute a suíte de testes dos módulos tocados para garantir que não há regressões cruzadas.
2. **Sincronização do Grafo**: Execute `graphify update .` para atualizar o grafo de conhecimento com todo o código entregue na sessão.
