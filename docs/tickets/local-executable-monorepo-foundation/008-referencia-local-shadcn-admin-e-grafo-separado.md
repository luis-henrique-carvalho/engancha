---
title: "Referência local do shadcn-admin e grafo separado"
status: "needs-triage"
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

- [ ] O clone de referência usa um diretório externo ao monorepo e não é adicionado aos arquivos ou dependências do produto.
- [ ] O procedimento de geração e atualização do grafo separado está documentado.
- [ ] A documentação explica como consultar padrões de sidebar, tema, navegação e componentes.
- [ ] A ausência do clone não impede a inicialização do web, API, worker ou infraestrutura.
- [ ] Uma verificação confirma que o grafo do Engancha não indexa o diretório da referência por padrão.

## Blocked by

None - can start immediately.

## Result

Preencher durante a implementação com comportamento entregue, contratos, arquivos principais, decisões e validações executadas.
