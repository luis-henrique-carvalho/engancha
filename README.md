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

O worker executa o mesmo probe de Redis antes de registrar o evento `ready`, aguarda o consumidor BullMQ ficar pronto e processa a fila técnica `verification`. Se Redis estiver indisponível, o processo termina com `Redis dependency unavailable` e não anuncia prontidão. Os eventos `job_received`, `job_processing`, `job_succeeded`, `job_retry` e `job_failed_definitive` carregam `jobId` e `correlationId` quando disponíveis.

Para parar a infraestrutura local:

```bash
npm run infra:down
```

Os volumes nomeados não são removidos por esse comando. A fundação não cria schema, migrations ou dados de domínio.

## Percurso completo de verificação

Com a infraestrutura saudável, abra três terminais na raiz do repositório:

```bash
npm run infra:up
npm run api:dev
npm run worker:dev
```

Em um quarto terminal, confirme os serviços e dispare o job técnico:

```bash
docker compose ps
curl -sS http://localhost:3001/api/v1/health/live
curl -sS http://localhost:3001/api/v1/health/ready
curl -sS -X POST http://localhost:3001/api/v1/dev/verification \
  -H 'content-type: application/json' \
  -d '{"version":"v1","correlationId":"manual-local-123","payload":{}}'
```

A resposta do último comando contém somente `jobId` e `correlationId`. Use o mesmo `correlationId` para localizar, nos logs do worker, os eventos `job_received`, `job_processing` e `job_succeeded`. O teste automatizado `tests/local-flow.test.mjs` verifica o mesmo percurso entre as fronteiras públicas da API e do worker usando o contrato compartilhado; a execução manual acima valida a integração real com BullMQ e Redis.

Para encerrar os processos, use `Ctrl-C` nos terminais da API, worker e web. Depois, remova somente os containers da infraestrutura sem remover os volumes locais:

```bash
npm run infra:down
```

Falhas esperadas:

- sem `.env`, ou com `PORT`, `DATABASE_URL`, `REDIS_URL` ou `NODE_ENV` inválidos, API/worker encerram o bootstrap com o nome da configuração inválida, sem imprimir o valor secreto;
- com Redis ou PostgreSQL parado, `/api/v1/health/ready` retorna `503` e informa apenas `up`/`down`; o worker não registra `ready` sem Redis;
- payload inválido no endpoint técnico retorna `400` e não cria job;
- Redis indisponível durante o enfileiramento retorna `503` sanitizado.

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

As regras para configurar filas, criar producers e consumers, validar jobs e tratar o shutdown estão em [`docs/NESTJS-BULLMQ-BEST-PRACTICES.md`](docs/NESTJS-BULLMQ-BEST-PRACTICES.md).

O shell web é independente da API e do worker nesta fatia; os processos backend apenas confirmam que seus entrypoints locais estão disponíveis para os próximos tickets.
