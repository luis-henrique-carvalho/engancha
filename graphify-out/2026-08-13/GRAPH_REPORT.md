# Graph Report - insta-flow  (2026-08-13)

## Corpus Check
- 60 files · ~32,888 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 718 nodes · 727 edges · 55 communities (49 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `23dcc70d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Engancha — Requisitos Funcionais
- Engancha — Roadmap
- 5. Entidades
- What You Must Do When Invoked
- Engancha — Architecture
- Épico candidato C — Criação e gestão de automações
- local-executable-monorepo-foundation.md
- 002-runtime-nest-configuracao-e-operacao.md
- Fundação executável local do monorepo
- graphify reference: extra exports and benchmark
- 001-monorepo-executavel-e-shell-web.md
- Épico futuro — Integração real com Instagram/Meta
- PRD to Tickets
- 10. Épicos candidatos consolidados
- 6. Regras de negócio transversais
- Épico candidato D — Simulação de comentários e automações
- graphify reference: query, path, explain
- web/package.json
- 8. Contratos mínimos de API
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- AGENTS.md
- extraction-spec.md
- Épico candidato A — Autenticação e acesso
- 2. Perfis e atores
- scripts
- routeTree.gen.ts
- compilerOptions
- compilerOptions
- devDependencies
- compilerOptions
- compilerOptions
- dependencies
- dependencies
- contracts/package.json
- Épico candidato E — Conversas, contatos e leads
- contracts/tsconfig.json
- 5.1 Contrato transversal de canais e providers
- Épico candidato B — Organizations e workspaces
- Épico candidato H — Operação e monitoramento
- Engancha
- 7. Estados funcionais
- Épico candidato F — Dashboard e métricas
- Épico candidato G — E-mails transacionais
- workspace-foundation.test.mjs
- api/src/app.module.ts
- index.ts
- worker/src/app.module.ts
- api/nest-cli.json
- worker/nest-cli.json

## God Nodes (most connected - your core abstractions)
1. `Engancha — Requisitos Funcionais` - 23 edges
2. `Engancha — Architecture` - 21 edges
3. `Engancha — Roadmap` - 19 edges
4. `Fundação executável local do monorepo` - 16 edges
5. `Épico candidato C — Criação e gestão de automações` - 15 edges
6. `scripts` - 14 edges
7. `5. Entidades` - 14 edges
8. `Engancha — Modelo de Dados` - 13 edges
9. `compilerOptions` - 12 edges
10. `What You Must Do When Invoked` - 12 edges

## Surprising Connections (you probably didn't know these)
- `FileRoutesById` --references--> `Route`  [EXTRACTED]
  apps/web/src/routeTree.gen.ts → apps/web/src/routes/__root.tsx
- `FileRoutesByPath` --references--> `Route`  [EXTRACTED]
  apps/web/src/routeTree.gen.ts → apps/web/src/routes/index.tsx
- `FileRoutesByPath` --references--> `Route`  [EXTRACTED]
  apps/web/src/routeTree.gen.ts → apps/web/src/routes/__root.tsx
- `Register` --references--> `getRouter()`  [EXTRACTED]
  apps/web/src/routeTree.gen.ts → apps/web/src/router.tsx

## Import Cycles
- None detected.

## Communities (55 total, 6 thin omitted)

### Community 0 - "Engancha — Requisitos Funcionais"
Cohesion: 0.20
Nodes (10): 11. Dependências entre épicos, 12. Decisões ainda necessárias antes das histórias, 1. Objetivo do documento, 3. Convenções, 4. Escopo do MVP, 5. Requisitos funcionais, 9. Critérios de aceite do MVP, Engancha — Requisitos Funcionais (+2 more)

### Community 1 - "Engancha — Roadmap"
Cohesion: 0.05
Nodes (42): Abstração de canal, API, API e interface, Backend base, Backlog posterior, Better Auth, Bull Board, Checklist de validação (+34 more)

### Community 2 - "5. Entidades"
Cohesion: 0.06
Nodes (33): 10. Mapeamento para requisitos, 11. Decisões adiadas, 12. Critério de aprovação, 1. Objetivo, 2. Princípios, 3. Separação entre autenticação e produto, 4. Diagrama lógico, 5.10 Tag (+25 more)

### Community 3 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 4 - "Engancha — Architecture"
Cohesion: 0.05
Nodes (38): 10. Fluxo principal do MVP, 11. Autenticação e e-mail, 12. Bull Board, 13. Frontend, 14. Segurança e isolamento, 15. Deploy e operação, 16. Testes, 17. Observabilidade mínima (+30 more)

### Community 5 - "Épico candidato C — Criação e gestão de automações"
Cohesion: 0.13
Nodes (15): FR-AUTO-001 — Listar automações, FR-AUTO-002 — Iniciar criação de automação, FR-AUTO-003 — Definir identificação da automação, FR-AUTO-004 — Configurar palavra-chave, FR-AUTO-005 — Configurar resposta pública, FR-AUTO-006 — Configurar DM automática, FR-AUTO-007 — Configurar ação final de link, FR-AUTO-008 — Configurar captura de e-mail (+7 more)

### Community 6 - "local-executable-monorepo-foundation.md"
Cohesion: 0.05
Nodes (30): Acceptance criteria, Blocked by, Parent, Result, What to build, Acceptance criteria, Blocked by, Parent (+22 more)

### Community 7 - "002-runtime-nest-configuracao-e-operacao.md"
Cohesion: 0.14
Nodes (13): Acceptance criteria, Blocked by, Bootstrap da API, Bootstrap do worker, Configuração validada, Decisões de instalação e topologia, Dependências mínimas, Encerramento ordenado (+5 more)

### Community 8 - "Fundação executável local do monorepo"
Cohesion: 0.11
Nodes (19): Acceptance Criteria, Actors and Permissions, Contracts and Integrations, Decision Log, Domain Rules and Data, Failures and recovery, Functional Behavior, Fundação executável local do monorepo (+11 more)

### Community 9 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 10 - "001-monorepo-executavel-e-shell-web.md"
Cohesion: 0.12
Nodes (15): Acceptance criteria, Arquivos principais, Blocked by, Comandos de instalação e verificação, Comportamento entregue, Decisões de instalação, Dependências e configuração compartilhada, Implementation notes (+7 more)

### Community 11 - "Épico futuro — Integração real com Instagram/Meta"
Cohesion: 0.18
Nodes (11): FR-META-001 — Conectar conta profissional, FR-META-002 — Associar conta ao workspace, FR-META-003 — Armazenar credenciais com segurança, FR-META-004 — Receber comentários via webhook, FR-META-005 — Receber mensagens via webhook, FR-META-006 — Responder comentário, FR-META-007 — Enviar mensagem, FR-META-008 — Deduplicar eventos externos (+3 more)

### Community 12 - "PRD to Tickets"
Cohesion: 0.20
Nodes (9): Entradas e escopo, Fase 1 — Entender o contexto, Fase 2 — Resolver decisões com o usuário, Fase 3 — Criar a PRD, Fase 4 — Propor tickets verticais, Fase 5 — Criar tickets locais, Fase 6 — Verificar a saída, Objetivo (+1 more)

### Community 13 - "10. Épicos candidatos consolidados"
Cohesion: 0.20
Nodes (10): 10. Épicos candidatos consolidados, EPIC-01 — Autenticação e acesso, EPIC-02 — Workspaces e isolamento multi-tenant, EPIC-03 — Gestão de automações, EPIC-04 — Simulação do fluxo Instagram-first, EPIC-05 — Conversas, contatos e leads, EPIC-06 — Dashboard e métricas, EPIC-07 — E-mails transacionais (+2 more)

### Community 14 - "6. Regras de negócio transversais"
Cohesion: 0.22
Nodes (9): 6. Regras de negócio transversais, RN-001 — Isolamento por Organization, RN-002 — Automação publicada, RN-003 — Histórico imutável de execução, RN-004 — Idempotência, RN-005 — Falha de uma execução, RN-006 — Fonte de verdade, RN-007 — Simulação não representa provider real (+1 more)

### Community 15 - "Épico candidato D — Simulação de comentários e automações"
Cohesion: 0.22
Nodes (9): FR-SIM-001 — Simular comentário, FR-SIM-002 — Avaliar correspondência da palavra-chave, FR-SIM-003 — Processar resposta pública, FR-SIM-004 — Processar DM, FR-SIM-005 — Processar link, FR-SIM-006 — Processar captura de e-mail, FR-SIM-007 — Consultar status da execução, FR-SIM-008 — Reprocessar execução com falha (+1 more)

### Community 16 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 17 - "web/package.json"
Cohesion: 0.07
Nodes (29): dependencies, react, react-dom, @tanstack/react-router, @tanstack/react-start, devDependencies, @types/react, @types/react-dom (+21 more)

### Community 18 - "8. Contratos mínimos de API"
Cohesion: 0.29
Nodes (7): 8. Contratos mínimos de API, Autenticação, Automações, Conversas e dados, Dashboard, Simulações, Workspaces

### Community 19 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 20 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 21 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 26 - "Épico candidato A — Autenticação e acesso"
Cohesion: 0.29
Nodes (7): FR-AUTH-001 — Criar conta com e-mail e senha, FR-AUTH-002 — Entrar com e-mail e senha, FR-AUTH-003 — Entrar com Google, FR-AUTH-004 — Confirmar endereço de e-mail, FR-AUTH-005 — Recuperar senha, FR-AUTH-006 — Encerrar sessão, Épico candidato A — Autenticação e acesso

### Community 27 - "2. Perfis e atores"
Cohesion: 0.33
Nodes (6): 2.1 Usuário, 2.2 Membro do workspace, 2.3 Administrador da plataforma, 2.4 Worker, 2.5 Sistema externo, 2. Perfis e atores

### Community 28 - "scripts"
Cohesion: 0.08
Nodes (23): description, engines, node, name, private, scripts, api:dev, api:start (+15 more)

### Community 29 - "routeTree.gen.ts"
Cohesion: 0.13
Nodes (16): getRouter(), Register, @tanstack/react-router, Route, Route, FileRoutesByFullPath, FileRoutesById, FileRoutesByPath (+8 more)

### Community 30 - "compilerOptions"
Cohesion: 0.10
Nodes (20): coverage, dist, node_modules, .output, packages/contracts/src/*, packages/contracts/src/index.ts, compilerOptions, baseUrl (+12 more)

### Community 31 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, jsx, module, moduleResolution, skipLibCheck, strictNullChecks, target (+9 more)

### Community 32 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint, @eslint/js, globals, @nestjs/cli, devDependencies, eslint, @eslint/js, globals (+11 more)

### Community 33 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, emitDecoratorMetadata, experimentalDecorators, module, moduleResolution, noEmit, outDir, rootDir (+6 more)

### Community 34 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, emitDecoratorMetadata, experimentalDecorators, module, moduleResolution, noEmit, outDir, rootDir (+6 more)

### Community 35 - "dependencies"
Cohesion: 0.06
Nodes (31): dependencies, class-transformer, class-validator, joi, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/platform-express (+23 more)

### Community 36 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, joi, @nestjs/common, @nestjs/config, @nestjs/core, reflect-metadata, rxjs, joi (+14 more)

### Community 37 - "contracts/package.json"
Cohesion: 0.25
Nodes (7): exports, name, private, scripts, typecheck, type, version

### Community 38 - "Épico candidato E — Conversas, contatos e leads"
Cohesion: 0.29
Nodes (7): FR-DATA-001 — Registrar conversa, FR-DATA-002 — Listar conversas, FR-DATA-003 — Criar ou atualizar contato, FR-DATA-004 — Marcar lead, FR-DATA-005 — Listar contatos e leads, FR-DATA-006 — Aplicar e consultar tags, Épico candidato E — Conversas, contatos e leads

### Community 39 - "contracts/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 40 - "5.1 Contrato transversal de canais e providers"
Cohesion: 0.33
Nodes (6): 5.1 Contrato transversal de canais e providers, FR-CHANNEL-001 — Separar provider e modo de execução, FR-CHANNEL-002 — Normalizar interações e mensagens, FR-CHANNEL-003 — Declarar capacidades do canal, FR-CHANNEL-004 — Isolar adapters de provider, FR-CHANNEL-005 — Preservar rastreabilidade do canal

### Community 41 - "Épico candidato B — Organizations e workspaces"
Cohesion: 0.33
Nodes (6): FR-WORK-001 — Criar workspace padrão, FR-WORK-002 — Exibir workspace ativo, FR-WORK-003 — Trocar workspace ativo, FR-WORK-004 — Isolar dados por workspace, FR-WORK-005 — Preparar membros futuros, Épico candidato B — Organizations e workspaces

### Community 42 - "Épico candidato H — Operação e monitoramento"
Cohesion: 0.40
Nodes (5): FR-OPS-001 — Visualizar filas, FR-OPS-002 — Proteger Bull Board, FR-OPS-003 — Inspecionar jobs, FR-OPS-004 — Reprocessar ou remover job, Épico candidato H — Operação e monitoramento

### Community 43 - "Engancha"
Cohesion: 0.40
Nodes (4): Engancha, Inicialização, Instalação, Pré-requisitos

### Community 44 - "7. Estados funcionais"
Cohesion: 0.50
Nodes (4): 7.1 Automação, 7.2 Execução, 7.3 Contato/lead, 7. Estados funcionais

### Community 45 - "Épico candidato F — Dashboard e métricas"
Cohesion: 0.50
Nodes (4): FR-ANALYTICS-001 — Exibir resumo do workspace, FR-ANALYTICS-002 — Filtrar período, FR-ANALYTICS-003 — Atualizar métricas após execução, Épico candidato F — Dashboard e métricas

### Community 46 - "Épico candidato G — E-mails transacionais"
Cohesion: 0.50
Nodes (4): FR-EMAIL-001 — Enfileirar e-mail transacional, FR-EMAIL-002 — Enviar e-mail via Resend, FR-EMAIL-003 — Reenviar confirmação, Épico candidato G — E-mails transacionais

### Community 48 - "api/src/app.module.ts"
Cohesion: 0.07
Nodes (17): AppController, AppModule, Module, ErrorResponse, GlobalExceptionFilter, RuntimeLifecycleService, Injectable, ShutdownGuard (+9 more)

### Community 51 - "worker/src/app.module.ts"
Cohesion: 0.13
Nodes (9): AppModule, Module, RuntimeLifecycleService, Injectable, StructuredLogger, Injectable, validateWorkerEnvironment(), workerEnvSchema (+1 more)

### Community 53 - "api/nest-cli.json"
Cohesion: 0.29
Nodes (6): collection, compilerOptions, deleteOutDir, entryFile, $schema, sourceRoot

### Community 54 - "worker/nest-cli.json"
Cohesion: 0.29
Nodes (6): collection, compilerOptions, deleteOutDir, entryFile, $schema, sourceRoot

## Knowledge Gaps
- **487 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `entryFile`, `deleteOutDir` (+482 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Engancha — Requisitos Funcionais` connect `Engancha — Requisitos Funcionais` to `5. Entidades`, `Épico candidato C — Criação e gestão de automações`, `Épico candidato E — Conversas, contatos e leads`, `5.1 Contrato transversal de canais e providers`, `Épico candidato B — Organizations e workspaces`, `Épico candidato H — Operação e monitoramento`, `Épico futuro — Integração real com Instagram/Meta`, `7. Estados funcionais`, `10. Épicos candidatos consolidados`, `6. Regras de negócio transversais`, `Épico candidato D — Simulação de comentários e automações`, `Épico candidato F — Dashboard e métricas`, `Épico candidato G — E-mails transacionais`, `8. Contratos mínimos de API`, `Épico candidato A — Autenticação e acesso`, `2. Perfis e atores`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `Engancha — Roadmap` connect `Engancha — Roadmap` to `5. Entidades`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `Engancha — Architecture` connect `Engancha — Architecture` to `5. Entidades`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _487 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Engancha — Roadmap` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
- **Should `5. Entidades` be split into smaller, more focused modules?**
  _Cohesion score 0.05855855855855856 - nodes in this community are weakly interconnected._
- **Should `What You Must Do When Invoked` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._