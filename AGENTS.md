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
