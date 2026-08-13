## Git e GitHub

Use o plugin `@github` como ponto de entrada para qualquer tarefa relacionada a Git ou GitHub. O plugin deve orientar o fluxo de repositório, branches, worktrees, commits, push, pull requests, issues, comentários, revisões e GitHub Actions.

### Roteamento do plugin

- Use a GitHub App do plugin primeiro para contexto de repositório, issues, PRs, patches, comentários, labels e reactions.
- Para publicar alterações — preparar branch, criar worktree quando necessário, selecionar arquivos, commitar, fazer push e abrir PR — use `github:yeet`.
- Para comentários ou solicitações de mudança em PRs, use `github:gh-address-comments`.
- Para checks ou logs falhos do GitHub Actions, use `github:gh-fix-ci`.
- Use `git` local para branch, worktree, status, diff, staging, commit e push quando essas operações não forem cobertas pelo conector. Use `gh` somente para lacunas do conector, como autenticação, descoberta da PR da branch atual, GitHub Actions e criação de PR quando necessário.

### Regras para branch, worktree e publicação

1. Antes de alterar ou publicar qualquer coisa, inspecionar `git status -sb`, a branch atual, os worktrees e o remote. Preservar alterações existentes e informar mudanças não relacionadas.
2. Não trocar de branch, criar worktree sobre uma árvore suja, fazer `git add -A`, commitar, fazer push ou abrir PR sem confirmar que o escopo está correto. Nunca incluir alterações não relacionadas silenciosamente.
3. Para trabalho isolado, usar um worktree dedicado em `.worktrees/<slug>` e criá-lo com `git worktree add .worktrees/<slug> -b <branch> <branch-base>`. Garantir que `.worktrees/` esteja no `.gitignore`.
4. Para tickets em `docs/tickets/`, seguir também as regras específicas de isolamento abaixo: branch `feat/<slug>` e worktree `.worktrees/<slug>`. Para trabalho iniciado a partir de `main`, `master` ou da branch padrão sem convenção específica de ticket, usar a convenção do plugin `github:yeet`: `agent/<description>`.
5. Se a branch ou o worktree já existir, reutilizá-lo somente após confirmar que pertence à mesma tarefa. Nunca sobrescrever, resetar, remover ou descartar alterações existentes.
6. Fazer staging apenas dos arquivos aprovados. Criar commits intencionais e concisos, executar as validações relevantes e registrar os comandos e resultados.
7. Só fazer push e abrir PR quando o usuário pedir a publicação. Por padrão, abrir uma draft PR; criar uma PR pronta para review somente quando solicitado explicitamente.
8. Após o push, preferir a GitHub App do plugin para criar a PR. Usar `gh` como fallback apenas quando o conector não conseguir determinar repositório, branch de origem/destino ou semântica de fork.
9. Não fazer merge, aprovar, resolver threads, fechar PR, apagar branch ou remover worktree automaticamente. Essas ações exigem pedido explícito do usuário.
10. Antes de operações que dependam do GitHub CLI, verificar `gh --version` e `gh auth status`. Se a autenticação ou o remote acessível estiverem ausentes, informar o bloqueio e pedir que o usuário resolva-o antes de prosseguir.

### Contexto e segurança de PRs

- Derivar repositório, branch de origem e branch-base do contexto local e do GitHub; nunca inventar esses valores.
- A descrição da PR deve explicar o que mudou, por que mudou, impacto, causa-raiz quando for correção e validações executadas.
- Não responder comentários, resolver threads, submeter review ou alterar metadados da PR sem solicitação explícita.
- Em tarefas de CI, primeiro diagnosticar e resumir a causa observada; implementar correções somente após aprovação explícita quando o fluxo `github:gh-fix-ci` exigir.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Workflow de desenvolvimento

Para novas funcionalidades ou épicos:

1. Use `prd-to-tickets` para analisar o requisito, resolver decisões pendentes, criar a PRD e propor tickets.
2. Após a aprovação dos tickets, implemente uma fatia vertical por vez.
3. Use `tdd` para tickets que alterem comportamentos, APIs, regras de negócio ou integrações.
4. Use `nestjs-best-practices` em tickets da API e do worker NestJS.
5. Use `frontend-design` em tickets que criem ou alterem interfaces.
6. Use `review` ao concluir cada fatia vertical ou épico.
7. Atualize a seção `Result` do ticket com o comportamento entregue e as validações executadas.
8. Depois de modificar código, execute `graphify update .`.

Não aplicar todas as skills indiscriminadamente:

- TDD não é obrigatório para configuração inicial ou ajustes puramente operacionais.
- `nestjs-best-practices` aplica-se à API e ao worker NestJS.
- `frontend-design` aplica-se às interfaces do produto.

## Isolamento de tarefas por ticket

Quando o usuário iniciar a implementação de um ticket localizado em `docs/tickets/`, o Codex deve preparar um worktree e uma branch dedicados antes de editar código.

1. Identificar o caminho completo do ticket e ler seu frontmatter, `Blocked by`, critérios de aceite e `Result`.
2. Não iniciar a implementação se o ticket estiver `done`, bloqueado por dependência não concluída ou sem aprovação quando a aprovação for exigida pelo fluxo de tickets.
3. Derivar um slug ASCII lowercase com hífens do nome do arquivo sem a extensão `.md`. Para `docs/tickets/<grupo>/001-minha-feature.md`, usar:
   - branch: `feat/001-minha-feature`;
   - worktree: `.worktrees/001-minha-feature`.
4. Antes de criar o worktree, verificar a branch-base configurada. Usar `main` quando ela existir; caso contrário, usar a branch-base indicada pelo usuário. Nunca criar o worktree a partir de uma árvore com alterações do usuário sem informar isso.
5. Criar o isolamento com `git worktree add .worktrees/<slug> -b feat/<slug> <branch-base>`, criar `.worktrees/` no `.gitignore` se necessário e executar todos os comandos de implementação dentro do worktree novo.
6. Se a branch ou o worktree já existir, reutilizá-lo somente depois de confirmar que corresponde ao mesmo ticket; nunca sobrescrever, remover ou resetar alterações existentes.
7. Ao concluir, atualizar o `Result` e os critérios de aceite do ticket dentro da branch do ticket, executar as validações aplicáveis e informar o caminho do worktree, o nome da branch e os comandos executados.
8. Não fazer merge, push, apagar branch ou remover worktree automaticamente. Essas ações exigem pedido explícito do usuário.

Se o usuário pedir explicitamente apenas uma branch, sem worktree, usar a mesma convenção de nome (`feat/<slug>`) no diretório atual, depois de verificar e reportar o estado das alterações locais.
