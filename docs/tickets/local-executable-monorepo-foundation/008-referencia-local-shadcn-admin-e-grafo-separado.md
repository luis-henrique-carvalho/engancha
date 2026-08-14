---
title: "Referência local do shadcn-admin e grafo separado"
status: "done"
type: "AFK"
parent: "docs/prds/local-executable-monorepo-foundation.md"
blocked_by: []
user_stories: [1]
---

## Parent

PRD `local-executable-monorepo-foundation`; cobre a User Story 1 e os critérios de aceite da referência visual opcional e do isolamento entre grafos.

## What to build

Documentar o procedimento opcional para manter um clone superficial do `shadcn-admin` fora do monorepo, gerar e atualizar seu grafo `graphify` no diretório da referência e consultá-lo sem indexar o clone no grafo do Engancha.

## Acceptance criteria

- [x] O clone de referência usa um diretório externo ao monorepo e não é adicionado aos arquivos ou dependências do produto.
- [x] O procedimento de geração e atualização do grafo separado está documentado.
- [x] A documentação explica como consultar padrões de sidebar, tema, navegação e componentes.
- [x] A ausência do clone não impede a inicialização do web, API, worker ou infraestrutura.
- [x] Uma verificação confirma que o grafo do Engancha não indexa o diretório da referência por padrão.

## Blocked by

None - can start immediately.

## Result

Documentado no `README.md` o uso opcional de `satnaing/shadcn-admin` como referência visual. O clone é superficial e fica em um diretório externo estável (`$XDG_DATA_HOME/engancha/shadcn-admin-reference`, com sobrescrita por `ENGANCHA_SHADCN_ADMIN_REFERENCE_DIR`), portanto não integra o workspace, as dependências, os arquivos versionados nem o runtime do Engancha — inclusive quando o projeto está em uma worktree.

O procedimento gera e atualiza o `graphify-out/` dentro do próprio clone e inclui consultas direcionadas a sidebar, tema, navegação e componentes. A documentação determina que padrões sejam portados ou adaptados explicitamente para `apps/web`, sem importar o runtime Vite ou dependências da referência.

Arquivos principais: `README.md` e este ticket.

Validações executadas:

- revisão de `.gitignore`: `graphify-out/` é ignorado tanto na raiz quanto em subdiretórios;
- revisão dos scripts do workspace no `README.md`: web, API, worker e infraestrutura não dependem do clone opcional;
- adicionada uma verificação reproduzível com `rg` que falha se o caminho externo configurado da referência aparecer em `Engancha/graphify-out/graph.json`.
