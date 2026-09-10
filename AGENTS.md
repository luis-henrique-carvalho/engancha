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

## Workflow de Desenvolvimento & Matriz de Skills

Para novas funcionalidades, refatorações ou épicos, siga o fluxo orientado a skills:

### Fase 1: Descoberta & Pesquisa
1. **Alinhamento de Requisitos**: Use `grill-me` se houver ambiguidades, trade-offs em aberto ou decisões de produto a tomar.
2. **Pesquisa Técnica**: Use `research` ao integrar bibliotecas desconhecidas, APIs externas ou specs complexas, registrando as descobertas.

### Fase 2: Design & Modelagem
3. **Modelo de Domínio**: Use `domain-modeling` para novos domínios, entidades e ADRs.
4. **Arquitetura de Módulos**: Use `codebase-design` para projetar *deep modules* e interfaces concisas com baixo acoplamento.
5. **Spikes / Prototipagem**: Use `prototype` se for necessário validar um fluxo de UI ou modelo de estado antes de codificar em definitivo.

### Fase 3: Planejamento & Tickets
6. **PRD & Tickets**: Use `prd-to-tickets` para conduzir o fluxo completo do Engancha: analisar contexto, resolver decisões materiais (DEC-XX), gerar a PRD em `docs/phases/` e decompor o trabalho em tickets verticais em `tickets/`.

### Fase 4: Implementação & Qualidade
7. **Execução de Tickets**: Implemente uma fatia vertical por vez usando `implement`.
8. **Estratégia de Testes**: Aplique `tdd` (ciclo red-green-refactor) para regras de negócio críticas, cálculos e serviços de domínio.
9. **Backend (NestJS)**: Aplique `nestjs-best-practices` em tickets da API e workers.
10. **Frontend (Web)**: Aplique `modern-web-guidance`, `vercel-react-best-practices` e `vercel-composition-patterns`.
11. **Refatoração Contínua**: Use `improve-codebase-architecture` quando o objetivo for simplificar dívida técnica ou desmembrar god nodes.

### Fase 5: Revisão & Finalização
12. **Revisão de Código**: Execute `code-review` ao concluir cada fatia vertical ou épico (avaliando *Standards* e *Spec*).
13. **Auditoria de UI/UX**: Use `web-design-guidelines` para acessibilidade e consistência visual.
14. **Documentação do Ticket**: Atualize a seção `Result` do ticket com o comportamento entregue e testes executados.
15. **Sincronização**: Execute `graphify update .`.

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
