# Engancha

Fundação executável local do monorepo do Engancha.

## Pré-requisitos

- Node.js 20 ou superior
- npm 10 ou superior

## Instalação

```bash
cp .env.example .env
npm install
```

O workspace usa npm e mantém o lockfile na raiz. Os pacotes locais são:

- `@engancha/web` — shell TanStack Start, disponível em `http://localhost:3000`;
- `@engancha/api` — processo reservado para a API HTTP;
- `@engancha/worker` — processo reservado para o worker assíncrono;
- `@engancha/contracts` — contratos transportáveis compartilhados.

## Inicialização

Cada processo pode ser executado separadamente:

```bash
npm run web:dev
npm run api:dev
npm run worker:dev
```

Para validar o shell web em modo compilado, o preview deve ser iniciado depois do build:

```bash
npm run web:build
npm run web:preview
```

Verificações locais:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
```

O shell web é independente da API e do worker nesta fatia; os processos backend apenas confirmam que seus entrypoints locais estão disponíveis para os próximos tickets.
