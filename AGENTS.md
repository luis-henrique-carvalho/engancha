# DIRETIVAS MANDATÓRIAS (EXECUTE ANTES DE QUALQUER AÇÃO)

1. **GRAPHIFY FIRST**: Para qualquer pergunta sobre código, arquitetura ou exploração do repositório, execute PRIMEIRO `graphify query "<termo>"` antes de ler arquivos ou buscar com grep/find.
2. **SHADCN REFERENCE GRAPHIFY**: Antes de criar ou alterar telas, fluxos ou componentes em `apps/web`, consulte PRIMEIRO a referência local (`shadcn-admin-reference`) via `graphify query`.
3. **GRAPHIFY UPDATE**: Imediatamente após alterar qualquer arquivo de código no repositório, execute `graphify update .`.

---

## Git e GitHub

Use o plugin `@github` como ponto de entrada para qualquer tarefa relacionada a Git ou GitHub. O plugin deve orientar o fluxo de repositório, branches, commits, push, pull requests, issues, comentários, revisões e GitHub Actions.

---

## graphify

This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts.
- Dirty `graphify-out/` files are expected after incremental updates; do not skip graphify because of them.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- Antes de criar ou alterar componentes web, consulte o grafo da referência local em `$XDG_DATA_HOME/engancha/shadcn-admin-reference`:
  ```bash
  reference_dir="${ENGANCHA_SHADCN_ADMIN_REFERENCE_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/engancha/shadcn-admin-reference}"
  cd "$reference_dir"
  graphify query "<padrão visual ou de interação a implementar>"
  ```

---

## Workflows de Desenvolvimento & Matriz de Skills

O ciclo de desenvolvimento opera em duas fases desacopladas (executadas em sessões separadas):
- **Planejamento & Especificação**: Use o workflow [`/plan-feature`](file:///home/luis/Documentos/Git/Engancha/.agents/workflows/plan-feature.md) para conduzir descoberta, arquitetura/design, criação de PRD em `docs/phases/` e decomposição em tickets verticais em `tickets/`.
- **Implementação & Entrega de Tickets**: Use o workflow [`/implement-ticket`](file:///home/luis/Documentos/Git/Engancha/.agents/workflows/implement-ticket.md) em sessões dedicadas para implementar um ou múltiplos tickets com TDD, aplicar padrões backend/frontend, rodar `code-review`, remediar e registrar o resultado em cada ticket.

---

## Convenções de Código

### Legibilidade
- Use uma linha em branco para separar blocos lógicos (construtor, métodos públicos e privados; etapas de carregamento, validação, persistência e resposta).
- Não separe decorators nem imports do mesmo grupo.
- Preserve a formatação do Prettier.

### Convenção de Features Web (`apps/web`)
- `apps/web/src/features/users` é a referência canônica.
- Toda feature deve organizar-se em `views/`, `components/`, `hooks/` e `services/` (e `data/` quando aplicável), conforme `apps/web/src/features/README.md`.
- Proibido criar chamadas HTTP, query keys ou mutations diretamente em rotas ou views.
