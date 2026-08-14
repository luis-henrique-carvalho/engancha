## Git e GitHub

Use o plugin `@github` como ponto de entrada para qualquer tarefa relacionada a Git ou GitHub. O plugin deve orientar o fluxo de repositório, branches, commits, push, pull requests, issues, comentários, revisões e GitHub Actions.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- Antes de criar ou alterar uma tela, fluxo ou componente de frontend, consulte a referência local `../shadcn-admin-reference` pelo seu grafo separado:
  ```bash
  cd ../shadcn-admin-reference
  graphify query "<padrão visual ou de interação a implementar>"
  ```
  Use-a para investigar a composição do dashboard, sidebar, navegação, tema, responsividade e componentes shadcn. Porte ou adapte explicitamente apenas os padrões necessários para `apps/web`; nunca importe o runtime Vite, dependências, arquivos ou `graphify-out/` da referência para o Engancha. Se o clone não existir, ele continua opcional; consulte o procedimento no `README.md` antes de seguir sem a referência.

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
