# Convenção de features

`features/users` é a implementação de referência obrigatória para novas
features do `apps/web`. Uma feature deve organizar seu código por
responsabilidade, nunca por tipo global de arquivo:

```text
features/<feature>/
├── views/       # composição da página/fluxo da feature
├── components/  # componentes de apresentação e UI local
├── hooks/       # TanStack Query, mutations e lógica de orquestração
├── services/    # fronteira com a API, query keys e invalidações
└── data/        # schemas, opções estáticas e mapeamentos, quando necessários
```

## Regras obrigatórias

- Rotas importam somente a `view` pública da feature; não montam sua UI nem
  chamam serviços diretamente.
- `views/` compõe `components/` e `hooks/`. Ela não faz `fetch`, não conhece
  detalhes de `apiFetch` e não declara query keys.
- `components/` são locais à feature e recebem dados e callbacks por props ou
  pelo provider local. Eles não acessam a API diretamente.
- `hooks/` concentram queries, mutations e a adaptação entre a view e os
  serviços. Uma mutation invalida as query keys da própria feature.
- `services/` encapsulam chamadas HTTP, query keys e helpers de invalidação.
  Nenhuma outra camada importa `apiFetch` para acessar o domínio da feature.
- `data/` não tem efeitos colaterais: apenas schemas, tipos derivados,
  constantes e transformações puras.
- Providers e diálogos pertencem a `components/` e são compostos pela view,
  como em `users/components/users-provider.tsx` e `users/components/users-dialogs.tsx`.
- Filtros e paginação compartilháveis pertencem à URL. A view recebe o estado
  da rota e o encaminha aos hooks e componentes da feature.

Exceções exigem uma decisão arquitetural documentada antes da implementação.
