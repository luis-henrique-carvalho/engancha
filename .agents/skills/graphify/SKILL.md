---
name: graphify
description: Consulta e atualiza o grafo de conhecimento local do Engancha. Use para perguntas sobre código, arquitetura, dependências, fluxos, relações entre arquivos ou antes de alterar uma tela, fluxo ou componente.
---

# Graphify do Engancha

Use o grafo local antes de navegar pelo código quando a tarefa envolver o conteúdo, a arquitetura ou as relações deste repositório.

## Perguntas sobre o código

1. Confirme se `graphify-out/graph.json` existe.
2. Execute `graphify query "<pergunta do usuário>"` a partir da raiz do repositório.
3. Para relações específicas, use `graphify path "<origem>" "<destino>"`; para um conceito isolado, use `graphify explain "<conceito>"`.
4. Responda a partir do resultado do grafo e cite os arquivos e locais indicados por ele. Só leia arquivos-fonte adicionais quando o grafo não fornecer contexto suficiente.

## Alterações de código

Depois de modificar arquivos de código, execute `graphify update .` na raiz do repositório para manter o grafo atualizado. Não execute uma reconstrução completa se a atualização incremental for suficiente.

## Frontend

Antes de criar ou alterar telas, fluxos ou componentes em `apps/web`, consulte primeiro a referência local de shadcn-admin, se ela existir:

```bash
reference_dir="${ENGANCHA_SHADCN_ADMIN_REFERENCE_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/engancha/shadcn-admin-reference}"
cd "$reference_dir"
graphify query "<padrão visual ou de interação a implementar>"
```

Adapte somente os padrões necessários ao Engancha. Nunca copie o runtime Vite, dependências ou `graphify-out/` da referência.

## Reconstrução do grafo

Use a reconstrução completa apenas quando o usuário pedir explicitamente `/graphify`, quando `graphify-out/graph.json` não existir, ou quando o grafo estiver desatualizado ou incorreto. Comece com `graphify --help` se precisar confirmar as opções disponíveis.
