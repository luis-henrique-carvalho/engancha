# Graph Report - insta-flow  (2026-08-13)

## Corpus Check
- 17 files · ~26,424 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 329 nodes · 319 edges · 29 communities (25 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8f3b2feb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Engancha — Roadmap
- Engancha — Requisitos Funcionais
- Engancha — Architecture
- What You Must Do When Invoked
- Engancha — Modelo de Dados
- Épico candidato C — Criação e gestão de automações
- 5. Entidades
- Épico futuro — Integração real com Instagram/Meta
- Fundação executável local do monorepo
- graphify reference: extra exports and benchmark
- 6. Regras de negócio transversais
- Épico candidato D — Simulação de comentários e automações
- PRD to Tickets
- 8. Contratos mínimos de API
- Épico candidato A — Autenticação e acesso
- Épico candidato E — Conversas, contatos e leads
- graphify reference: query, path, explain
- 10. Épicos candidatos consolidados
- 8. Domínios e módulos
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- AGENTS.md
- extraction-spec.md
- Épico candidato B — Organizations e workspaces
- 2. Perfis e atores
- Fase 1 — Fundação do monorepo e infraestrutura

## God Nodes (most connected - your core abstractions)
1. `Engancha — Requisitos Funcionais` - 23 edges
2. `Engancha — Architecture` - 21 edges
3. `Engancha — Roadmap` - 19 edges
4. `Épico candidato C — Criação e gestão de automações` - 15 edges
5. `Fundação executável local do monorepo` - 15 edges
6. `5. Entidades` - 14 edges
7. `Engancha — Modelo de Dados` - 13 edges
8. `What You Must Do When Invoked` - 12 edges
9. `Épico futuro — Integração real com Instagram/Meta` - 11 edges
10. `/graphify` - 10 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (29 total, 4 thin omitted)

### Community 0 - "Engancha — Roadmap"
Cohesion: 0.06
Nodes (36): Abstração de canal, API, API e interface, Backlog posterior, Better Auth, Bull Board, Checklist de validação, Como usar este roadmap (+28 more)

### Community 1 - "Engancha — Requisitos Funcionais"
Cohesion: 0.06
Nodes (33): 11. Dependências entre épicos, 12. Decisões ainda necessárias antes das histórias, 1. Objetivo do documento, 3. Convenções, 4. Escopo do MVP, 5.1 Contrato transversal de canais e providers, 5. Requisitos funcionais, 7.1 Automação (+25 more)

### Community 2 - "Engancha — Architecture"
Cohesion: 0.06
Nodes (31): 10. Fluxo principal do MVP, 11. Autenticação e e-mail, 12. Bull Board, 13. Frontend, 14. Segurança e isolamento, 15. Deploy e operação, 16. Testes, 17. Observabilidade mínima (+23 more)

### Community 3 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 4 - "Engancha — Modelo de Dados"
Cohesion: 0.10
Nodes (19): 10. Mapeamento para requisitos, 11. Decisões adiadas, 12. Critério de aprovação, 1. Objetivo, 2. Princípios, 3. Separação entre autenticação e produto, 4. Diagrama lógico, 6.1 Capacidades do canal (+11 more)

### Community 5 - "Épico candidato C — Criação e gestão de automações"
Cohesion: 0.13
Nodes (15): FR-AUTO-001 — Listar automações, FR-AUTO-002 — Iniciar criação de automação, FR-AUTO-003 — Definir identificação da automação, FR-AUTO-004 — Configurar palavra-chave, FR-AUTO-005 — Configurar resposta pública, FR-AUTO-006 — Configurar DM automática, FR-AUTO-007 — Configurar ação final de link, FR-AUTO-008 — Configurar captura de e-mail (+7 more)

### Community 6 - "5. Entidades"
Cohesion: 0.14
Nodes (14): 5.10 Tag, 5.11 ContactTag, 5.12 ChannelConnection — futuro, 5.13 ExternalEvent — futuro, 5.1 Organization, 5.2 Automation, 5.3 AutomationTrigger, 5.4 AutomationAction (+6 more)

### Community 7 - "Épico futuro — Integração real com Instagram/Meta"
Cohesion: 0.18
Nodes (11): FR-META-001 — Conectar conta profissional, FR-META-002 — Associar conta ao workspace, FR-META-003 — Armazenar credenciais com segurança, FR-META-004 — Receber comentários via webhook, FR-META-005 — Receber mensagens via webhook, FR-META-006 — Responder comentário, FR-META-007 — Enviar mensagem, FR-META-008 — Deduplicar eventos externos (+3 more)

### Community 8 - "Fundação executável local do monorepo"
Cohesion: 0.11
Nodes (18): Acceptance Criteria, Actors and Permissions, Contracts and Integrations, Decision Log, Domain Rules and Data, Failures and recovery, Functional Behavior, Fundação executável local do monorepo (+10 more)

### Community 9 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 10 - "6. Regras de negócio transversais"
Cohesion: 0.22
Nodes (9): 6. Regras de negócio transversais, RN-001 — Isolamento por Organization, RN-002 — Automação publicada, RN-003 — Histórico imutável de execução, RN-004 — Idempotência, RN-005 — Falha de uma execução, RN-006 — Fonte de verdade, RN-007 — Simulação não representa provider real (+1 more)

### Community 11 - "Épico candidato D — Simulação de comentários e automações"
Cohesion: 0.22
Nodes (9): FR-SIM-001 — Simular comentário, FR-SIM-002 — Avaliar correspondência da palavra-chave, FR-SIM-003 — Processar resposta pública, FR-SIM-004 — Processar DM, FR-SIM-005 — Processar link, FR-SIM-006 — Processar captura de e-mail, FR-SIM-007 — Consultar status da execução, FR-SIM-008 — Reprocessar execução com falha (+1 more)

### Community 12 - "PRD to Tickets"
Cohesion: 0.20
Nodes (9): Entradas e escopo, Fase 1 — Entender o contexto, Fase 2 — Resolver decisões com o usuário, Fase 3 — Criar a PRD, Fase 4 — Propor tickets verticais, Fase 5 — Criar tickets locais, Fase 6 — Verificar a saída, Objetivo (+1 more)

### Community 13 - "8. Contratos mínimos de API"
Cohesion: 0.29
Nodes (7): 8. Contratos mínimos de API, Autenticação, Automações, Conversas e dados, Dashboard, Simulações, Workspaces

### Community 14 - "Épico candidato A — Autenticação e acesso"
Cohesion: 0.29
Nodes (7): FR-AUTH-001 — Criar conta com e-mail e senha, FR-AUTH-002 — Entrar com e-mail e senha, FR-AUTH-003 — Entrar com Google, FR-AUTH-004 — Confirmar endereço de e-mail, FR-AUTH-005 — Recuperar senha, FR-AUTH-006 — Encerrar sessão, Épico candidato A — Autenticação e acesso

### Community 15 - "Épico candidato E — Conversas, contatos e leads"
Cohesion: 0.29
Nodes (7): FR-DATA-001 — Registrar conversa, FR-DATA-002 — Listar conversas, FR-DATA-003 — Criar ou atualizar contato, FR-DATA-004 — Marcar lead, FR-DATA-005 — Listar contatos e leads, FR-DATA-006 — Aplicar e consultar tags, Épico candidato E — Conversas, contatos e leads

### Community 16 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 17 - "10. Épicos candidatos consolidados"
Cohesion: 0.20
Nodes (10): 10. Épicos candidatos consolidados, EPIC-01 — Autenticação e acesso, EPIC-02 — Workspaces e isolamento multi-tenant, EPIC-03 — Gestão de automações, EPIC-04 — Simulação do fluxo Instagram-first, EPIC-05 — Conversas, contatos e leads, EPIC-06 — Dashboard e métricas, EPIC-07 — E-mails transacionais (+2 more)

### Community 18 - "8. Domínios e módulos"
Cohesion: 0.29
Nodes (7): 8. Domínios e módulos, Analytics, Auth, Automations, Conversations e Contacts, Simulation, Workspaces

### Community 19 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 20 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 21 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 26 - "Épico candidato B — Organizations e workspaces"
Cohesion: 0.33
Nodes (6): FR-WORK-001 — Criar workspace padrão, FR-WORK-002 — Exibir workspace ativo, FR-WORK-003 — Trocar workspace ativo, FR-WORK-004 — Isolar dados por workspace, FR-WORK-005 — Preparar membros futuros, Épico candidato B — Organizations e workspaces

### Community 27 - "2. Perfis e atores"
Cohesion: 0.33
Nodes (6): 2.1 Usuário, 2.2 Membro do workspace, 2.3 Administrador da plataforma, 2.4 Worker, 2.5 Sistema externo, 2. Perfis e atores

### Community 28 - "Fase 1 — Fundação do monorepo e infraestrutura"
Cohesion: 0.33
Nodes (6): Backend base, Contratos, Dados e infraestrutura local, Fase 1 — Fundação do monorepo e infraestrutura, Frontend base, Monorepo

## Knowledge Gaps
- **265 isolated node(s):** `Usage`, `What graphify is for`, `Step 0 - GitHub repos and multi-path merge (only if a URL or several paths)`, `Step 1 - Ensure graphify is installed`, `Step 2 - Detect files` (+260 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Engancha — Requisitos Funcionais` connect `Engancha — Requisitos Funcionais` to `Engancha — Modelo de Dados`, `Épico candidato C — Criação e gestão de automações`, `Épico futuro — Integração real com Instagram/Meta`, `6. Regras de negócio transversais`, `Épico candidato D — Simulação de comentários e automações`, `8. Contratos mínimos de API`, `Épico candidato A — Autenticação e acesso`, `Épico candidato E — Conversas, contatos e leads`, `10. Épicos candidatos consolidados`, `Épico candidato B — Organizations e workspaces`, `2. Perfis e atores`?**
  _High betweenness centrality (0.383) - this node is a cross-community bridge._
- **Why does `Engancha — Roadmap` connect `Engancha — Roadmap` to `Engancha — Modelo de Dados`, `Fase 1 — Fundação do monorepo e infraestrutura`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Why does `Engancha — Architecture` connect `Engancha — Architecture` to `8. Domínios e módulos`, `Engancha — Modelo de Dados`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **What connects `Usage`, `What graphify is for`, `Step 0 - GitHub repos and multi-path merge (only if a URL or several paths)` to the rest of the system?**
  _265 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Engancha — Roadmap` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Engancha — Requisitos Funcionais` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `Engancha — Architecture` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._