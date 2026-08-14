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

## Referência visual opcional: shadcn-admin

O [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin) é somente uma referência de padrões visuais. Ele não é dependência, submódulo ou arquivo do Engancha: a ausência dele não altera os comandos de instalação, web, API, worker ou infraestrutura acima.

Para mantê-lo isolado de qualquer clone ou worktree do Engancha, mantenha-o em um local estável de dados do usuário, com histórico superficial. Por padrão, use `$XDG_DATA_HOME/engancha/shadcn-admin-reference` (ou `~/.local/share/engancha/shadcn-admin-reference` quando `XDG_DATA_HOME` não estiver definido). Defina `ENGANCHA_SHADCN_ADMIN_REFERENCE_DIR` se preferir outro diretório externo:

```bash
reference_dir="${ENGANCHA_SHADCN_ADMIN_REFERENCE_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/engancha/shadcn-admin-reference}"
mkdir -p "$(dirname "$reference_dir")"
git clone --depth 1 https://github.com/satnaing/shadcn-admin.git "$reference_dir"
cd "$reference_dir"
```

Não execute `npm install` nem copie arquivos desse clone para o monorepo apenas para consulta. Quando um ticket de frontend precisar de um padrão, porte ou adapte explicitamente os arquivos necessários para `apps/web`, respeitando as convenções e o runtime do Engancha.

### Grafo separado da referência

Gere e atualize o grafo sempre dentro do clone. Isso cria `shadcn-admin-reference/graphify-out/`, sem alterar o `graphify-out/` do Engancha nem depender da localização da worktree:

```bash
reference_dir="${ENGANCHA_SHADCN_ADMIN_REFERENCE_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/engancha/shadcn-admin-reference}"
cd "$reference_dir"
graphify .
graphify update .
```

Consulte o grafo da referência no mesmo diretório. Exemplos úteis:

```bash
graphify query "Where are the sidebar layout and menu groups defined?"
graphify query "How are light, dark, and system themes selected and persisted?"
graphify query "How is navigation structured across dashboard routes?"
graphify query "Which shadcn components are used by the dashboard shell?"
```

Abra os arquivos retornados pelo grafo e transfira apenas o padrão necessário; não importe o runtime Vite, as dependências ou o grafo da referência para `apps/web`.

### Verificação de isolamento

Da raiz do Engancha, após gerar os dois grafos, confirme que o grafo do produto não contém o caminho absoluto da referência:

```bash
reference_dir="${ENGANCHA_SHADCN_ADMIN_REFERENCE_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/engancha/shadcn-admin-reference}"
if rg -F --quiet "$reference_dir" graphify-out/graph.json; then
  echo "Falha: o grafo do Engancha contém a referência externa."
  exit 1
fi
echo "OK: grafos isolados."
```

O resultado esperado é `OK: grafos isolados.`. Para comparar os dois projetos, gere uma análise combinada somente em um diretório temporário e descarte-a depois; não a salve em `Engancha/graphify-out/`.
