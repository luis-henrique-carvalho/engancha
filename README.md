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

## Infraestrutura local

PostgreSQL e Redis são provisionados separadamente das aplicações pelo Docker Compose:

```bash
npm run infra:up
docker compose ps
```

Os dois serviços possuem health checks no Compose. Depois de copiar `.env.example` para `.env`, inicie a API e consulte:

```bash
curl http://localhost:3001/api/v1/health/live
curl -i http://localhost:3001/api/v1/health/ready
```

`/health/live` confirma que a API está viva. `/health/ready` retorna `200` somente quando a aplicação, PostgreSQL e Redis estão disponíveis; quando uma dependência falha, retorna `503` com apenas o estado (`up`/`down`), sem URLs ou credenciais.

O worker executa o mesmo probe de Redis antes de registrar o evento `ready`. Se Redis estiver indisponível, o processo termina com `Redis dependency unavailable` e não anuncia prontidão.

Para parar a infraestrutura local:

```bash
npm run infra:down
```

Os volumes nomeados não são removidos por esse comando. A fundação não cria schema, migrations ou dados de domínio.

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
npm run verify
```

`npm run verify` executa typecheck, testes, lint e verificação de formatação em uma única etapa.

O shell web é independente da API e do worker nesta fatia; os processos backend apenas confirmam que seus entrypoints locais estão disponíveis para os próximos tickets.
